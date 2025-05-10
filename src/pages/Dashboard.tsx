import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link as LinkIcon, Edit, Settings, Calendar, Users, Bell, Crown, Clock, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import CalendarComponent from "@/components/CalendarComponent";
import Navbar from "@/components/Navbar";
import PlanSettings from "@/components/PlanSettings";
import ServicesList from "@/components/ServicesList";
import AccountSettings from "@/components/AccountSettings";
import BusinessSettings from "@/components/BusinessSettings";
import CustomLinkSettings from "@/components/CustomLinkSettings";
import AvailabilitySettings from "@/components/AvailabilitySettings";
import AppointmentsList from "@/components/AppointmentsList";
import ClientsList from "@/components/ClientsList";
import StaffList from "@/components/StaffList";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [newAppointmentsCount, setNewAppointmentsCount] = useState(0);
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([]);
  const [userCustomUrl, setUserCustomUrl] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [monthlyAppointmentCreations, setMonthlyAppointmentCreations] = useState(0);
  const [planType, setPlanType] = useState("free");
  const [trialInfo, setTrialInfo] = useState<{active: boolean, endDate: string | null, daysLeft: number | null}>({
    active: false,
    endDate: null,
    daysLeft: null
  });
  const realtimeChannelRef = useRef<any>(null);
  
  // Set up realtime subscription for new appointments
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Set up realtime subscription for appointments changes
      const channel = supabase
        .channel('appointment-changes')
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            console.log('New appointment received:', payload);
            // Increment the new appointments counter
            setNewAppointmentsCount(prev => prev + 1);
            // Show a toast notification
            toast.success('Novo agendamento recebido!', {
              description: `Cliente: ${payload.new.client_name}`,
              action: {
                label: 'Ver',
                onClick: () => setSearchParams({ tab: 'agendamentos' })
              }
            });
            // Refresh dashboard data
            fetchDashboardData();
          }
        )
        .subscribe();
      
      realtimeChannelRef.current = channel;
      
      return () => {
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
        }
      };
    };
    
    setupRealtimeSubscription();
  }, []);
  
  useEffect(() => {
    fetchDashboardData();
    
    // Verificar status de assinatura do usuário
    checkSubscriptionStatus();
    
    // Verificar parâmetros de URL para mensagens de sucesso/erro após checkout
    if (searchParams.get('success') === 'true') {
      toast.success('Assinatura realizada com sucesso!');
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Processo de assinatura cancelado.');
    }
  }, []);
  
  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        method: 'GET'
      });
      
      if (error) throw error;
      
      if (data.subscribed) {
        // Se tiver assinatura ativa, atualizar o plano
        setPlanType('pro');
        fetchDashboardData(); // Recarregar dados após atualização do plano
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/auth";
        return;
      }
      
      // Fetch appointment count for current month (only confirmed appointments)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: apptCount, error: apptError } = await supabase
        .from("appointments")
        .select("*", { count: 'exact' })
        .eq("user_id", session.user.id)
        .eq("status", "confirmed")
        .gte("created_at", startOfMonth.toISOString());
      
      if (apptError) throw apptError;
      setAppointmentsCount(apptCount || 0);

      // Fetch TOTAL appointment creations this month (regardless of status)
      const { count: totalMonthlyCreations, error: totalError } = await supabase
        .from("appointments")
        .select("*", { count: 'exact' })
        .eq("user_id", session.user.id)
        .gte("created_at", startOfMonth.toISOString());
      
      if (totalError) throw totalError;
      setMonthlyAppointmentCreations(totalMonthlyCreations || 0);
      
      // Fetch clients count (unique clients with confirmed appointments)
      const { data: uniqueClients, error: clientError } = await supabase
        .rpc('get_clients_with_stats', { p_user_id: session.user.id });
      
      if (clientError) {
        console.error("Error fetching clients stats:", clientError);
        // Fallback to count query if RPC fails
        const { count: clientCount, error: countError } = await supabase
          .from("appointments")
          .select("client_email", { count: 'exact' })
          .eq("user_id", session.user.id)
          .eq("status", "confirmed");
          
        if (countError) throw countError;
        setClientsCount(clientCount || 0);
      } else {
        // If RPC succeeds, count the unique clients
        setClientsCount(uniqueClients?.length || 0);
      }
      
      // Fetch upcoming appointments for calendar (only confirmed)
      const { data: appointments, error: upcomingError } = await supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("user_id", session.user.id)
        .eq("status", "confirmed")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(20);
      
      if (upcomingError) throw upcomingError;
      setAppointmentDates(appointments?.map(a => new Date(a.scheduled_at)) || []);
      
      // Buscar dados da empresa, incluindo URL personalizada, tipo de plano e logo
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("logo_url, custom_url")
        .eq("id", session.user.id)
        .single();
        
      if (!profileError && profileData) {
        setCompanyLogo(profileData.logo_url);
        setUserCustomUrl(profileData.custom_url || "");
      }
      
      // Buscar informações do plano e período de teste
      const { data: configData, error: configError } = await supabase
        .from("company_config")
        .select("plan_type, trial_start_date, trial_end_date")
        .eq("user_id", session.user.id)
        .single();
        
      if (!configError && configData) {
        setPlanType(configData.plan_type);
        
        // Verificar se está em período de teste e calcular dias restantes
        if (configData.plan_type === 'trial' && configData.trial_end_date) {
          const endDate = parseISO(configData.trial_end_date);
          const today = new Date();
          
          if (endDate > today) {
            const daysLeft = differenceInDays(endDate, today);
            setTrialInfo({
              active: true,
              endDate: configData.trial_end_date,
              daysLeft: daysLeft
            });
          } else {
            // Se a data de término já passou, o trial expirou
            setTrialInfo({
              active: false,
              endDate: null,
              daysLeft: null
            });
          }
        } else {
          setTrialInfo({
            active: false,
            endDate: null,
            daysLeft: null
          });
        }
      }
      
      // Reset new appointments counter when data is refreshed
      setNewAppointmentsCount(0);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };
  
  const formatTrialEndDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };
  
  const getBookingUrl = () => {
    const baseUrl = window.location.origin;
    return userCustomUrl ? `${baseUrl}/${userCustomUrl}` : `${baseUrl}/undefined`;
  };
  
  const copyBookingUrl = () => {
    navigator.clipboard.writeText(getBookingUrl());
    toast.success("Link copiado para a área de transferência");
  };

  // Get the active tab from URL parameter or default to "agendamentos"
  const activeTab = searchParams.get("tab") || "agendamentos";
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="relative">
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchDashboardData}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {newAppointmentsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-red-500">
                    {newAppointmentsCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          <p className="text-gray-600 mb-8">Gerencie sua agenda e serviços</p>

          {/* Exibir banner informativo se estiver no período de teste */}
          {trialInfo.active && trialInfo.daysLeft !== null && trialInfo.endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-center gap-4">
              <div className="bg-blue-100 rounded-full p-2">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-blue-800 font-medium">Período de teste ativo</h3>
                <p className="text-blue-700">
                  {trialInfo.daysLeft > 0 ? (
                    <>Você tem <span className="font-semibold">{trialInfo.daysLeft} dias</span> restantes do período de teste. Aproveite todos os recursos do plano PRO até {formatTrialEndDate(trialInfo.endDate)}.</>
                  ) : (
                    <>Seu período de teste termina hoje. Faça upgrade para o plano PRO para continuar com todos os recursos.</>
                  )}
                </p>
              </div>
              <Button 
                className="ml-auto bg-blue-600 hover:bg-blue-700"
                size="sm"
                onClick={() => setSearchParams({ tab: 'configuracoes' })}
              >
                <Crown className="h-4 w-4 mr-1" />
                Ver planos
              </Button>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>Agendamentos</CardTitle>
                  <CardDescription>Total do mês</CardDescription>
                </div>
                <Calendar className="h-5 w-5 text-agendafacil-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{appointmentsCount}</div>
                <p className="text-sm text-muted-foreground">
                  {loading ? "Carregando..." : "Mês atual"}
                </p>
                {planType === "free" && monthlyAppointmentCreations >= 30 && monthlyAppointmentCreations < 60 && (
                  <p className="text-sm text-yellow-600 mt-2">
                    {`Você já utilizou ${monthlyAppointmentCreations}/60 agendamentos do seu limite mensal`}
                  </p>
                )}
                {planType === "free" && monthlyAppointmentCreations >= 60 && (
                  <p className="text-sm text-red-600 mt-2">
                    Limite mensal atingido (60/60)
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>Link personalizado</CardTitle>
                  <CardDescription>Compartilhe com clientes</CardDescription>
                </div>
                <LinkIcon className="h-5 w-5 text-agendafacil-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-10 w-10">
                    {companyLogo ? (
                      <AvatarImage src={companyLogo} alt="Logo da empresa" />
                    ) : (
                      <AvatarFallback className="bg-gray-100 text-gray-400">
                        ?
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-sm">
                    {userCustomUrl ? (
                      <span className="font-medium">{userCustomUrl}</span>
                    ) : (
                      <span className="text-gray-500">URL não definida</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <code className="text-sm bg-gray-100 p-2 rounded flex-grow truncate">
                    {getBookingUrl()}
                  </code>
                  <button 
                    onClick={copyBookingUrl}
                    className="ml-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm"
                  >
                    Copiar
                  </button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>Clientes</CardTitle>
                  <CardDescription>Base de clientes</CardDescription>
                </div>
                <Users className="h-5 w-5 text-agendafacil-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{clientsCount}</div>
                <p className="text-sm text-muted-foreground">
                  {loading ? "Carregando..." : "Total de clientes"}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
            <TabsList className="mb-6 overflow-x-auto flex flex-nowrap w-full md:w-auto">
              <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
              <TabsTrigger value="equipe">Equipe</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="agendamentos" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Próximos agendamentos</h3>
                  <AppointmentsList onAppointmentChanged={fetchDashboardData} />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-4">Calendário</h3>
                  <CalendarComponent highlightedDates={appointmentDates} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="servicos">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Serviços oferecidos</h3>
              </div>
              <ServicesList />
            </TabsContent>
            
            <TabsContent value="equipe">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Gerenciamento de Equipe</h3>
              </div>
              <StaffList />
            </TabsContent>
            
            <TabsContent value="clientes">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Clientes cadastrados</h3>
              </div>
              <ClientsList />
            </TabsContent>
            
            <TabsContent value="configuracoes">
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold mb-6">Configurações da conta</h3>
                
                <div className="space-y-8">
                  <Card>
                    <CardHeader className="flex flex-row items-start gap-4">
                      <Edit className="h-5 w-5 mt-1" />
                      <div>
                        <CardTitle>Informações da conta</CardTitle>
                        <CardDescription>Atualize seus dados pessoais e da empresa</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AccountSettings onUpdate={fetchDashboardData} />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-start gap-4">
                      <LinkIcon className="h-5 w-5 mt-1" />
                      <div>
                        <CardTitle>Link personalizado</CardTitle>
                        <CardDescription>Defina uma URL amigável para seu agendamento</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CustomLinkSettings 
                        currentUrl={userCustomUrl} 
                        onUpdate={(url) => setUserCustomUrl(url)} 
                      />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-start gap-4">
                      <Calendar className="h-5 w-5 mt-1" />
                      <div>
                        <CardTitle>Horários de funcionamento</CardTitle>
                        <CardDescription>Configure os horários disponíveis para agendamento</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AvailabilitySettings />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-start gap-4">
                      <Settings className="h-5 w-5 mt-1" />
                      <div>
                        <CardTitle>Informações do negócio</CardTitle>
                        <CardDescription>Configure os dados do seu estabelecimento</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <BusinessSettings />
                    </CardContent>
                  </Card>
                  
                  <PlanSettings 
                    monthlyCreationsCount={monthlyAppointmentCreations}
                    onUpgrade={fetchDashboardData}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
