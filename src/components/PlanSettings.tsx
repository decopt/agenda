import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Crown, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, addDays, parseISO, isAfter } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

const DEFAULT_WEBHOOK_URL = "https://webhook.conectdigitalpro.com/webhook/agendafacil";
const SUPPORT_WHATSAPP = "+351 910 769 951";
const TRIAL_DAYS = 7; // Duração do período de teste em dias

interface PlanData {
  planType: string;
  monthlyLimit: number;
  webhookUrl: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
}

interface PlanSettingsProps {
  monthlyCreationsCount?: number;
  onUpgrade?: () => void;
}

const PlanSettings = ({ monthlyCreationsCount = 0, onUpgrade }: PlanSettingsProps) => {
  const [planData, setPlanData] = useState<PlanData>({
    planType: 'free',
    monthlyLimit: 60,
    webhookUrl: null,
    trialStartDate: null,
    trialEndDate: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(DEFAULT_WEBHOOK_URL);
  const [upgradePlanDialogOpen, setUpgradePlanDialogOpen] = useState(false);
  const [startTrialDialogOpen, setStartTrialDialogOpen] = useState(false);

  useEffect(() => {
    loadPlanData();
  }, []);

  const loadPlanData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: config, error: configError } = await supabase
        .from('company_config')
        .select('plan_type, monthly_limit, webhook_url, trial_start_date, trial_end_date')
        .eq('user_id', session.user.id)
        .single();

      if (configError) {
        if (configError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('company_config')
            .insert({
              user_id: session.user.id,
              plan_type: 'free',
              monthly_limit: 60
            });

          if (insertError) throw insertError;
          
          setPlanData({
            planType: 'free',
            monthlyLimit: 60,
            webhookUrl: null,
            trialStartDate: null,
            trialEndDate: null
          });
          
          setWebhookUrl(DEFAULT_WEBHOOK_URL);
        } else {
          throw configError;
        }
      } else if (config) {
        setPlanData({
          planType: config.plan_type,
          monthlyLimit: config.monthly_limit,
          webhookUrl: config.webhook_url,
          trialStartDate: config.trial_start_date,
          trialEndDate: config.trial_end_date
        });
        
        // Para usuários PRO ou em período de teste, sempre definir o webhook URL padrão
        if (config.plan_type === 'pro' || config.plan_type === 'trial') {
          setWebhookUrl(DEFAULT_WEBHOOK_URL);
          
          // Se o webhook URL estiver vazio ou diferente do padrão para usuários PRO/TRIAL,
          // atualizar na base de dados
          if (config.webhook_url !== DEFAULT_WEBHOOK_URL) {
            const { error: updateError } = await supabase
              .from('company_config')
              .update({ webhook_url: DEFAULT_WEBHOOK_URL })
              .eq('user_id', session.user.id);
            
            if (updateError) {
              console.error('Erro ao definir webhook URL padrão:', updateError);
            }
          }
        } else {
          setWebhookUrl(config.webhook_url || DEFAULT_WEBHOOK_URL);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do plano:', error);
      toast.error('Erro ao carregar dados do plano');
    } finally {
      setLoading(false);
    }
  };
  
  const saveWebhookUrl = async () => {
    try {
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      if (planData.planType !== 'pro' && planData.planType !== 'trial') {
        toast.error('Recurso indisponível. Webhook URL está disponível apenas no plano PRO ou período de teste.');
        return;
      }
      
      // Para usuários PRO ou em período de teste, sempre usar o webhook URL padrão
      const urlToSave = DEFAULT_WEBHOOK_URL;
      
      const { error } = await supabase
        .from('company_config')
        .update({ webhook_url: urlToSave })
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      toast.success('A URL do webhook foi atualizada com sucesso.');
      
      setPlanData(prev => ({ ...prev, webhookUrl: urlToSave }));
      setWebhookUrl(urlToSave);
    } catch (error) {
      console.error('Erro ao salvar webhook URL:', error);
      toast.error('Não foi possível atualizar a URL do webhook.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpgradeToPro = async () => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        method: 'POST',
      });

      if (error) throw error;
      if (!data.url) throw new Error('URL de checkout não recebida');

      window.location.href = data.url;
    } catch (error) {
      console.error('Erro ao fazer upgrade do plano:', error);
      toast.error('Não foi possível iniciar o processo de upgrade.');
    } finally {
      setSaving(false);
      setUpgradePlanDialogOpen(false);
    }
  };
  
  const startFreeTrial = async () => {
    try {
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Usuário não autenticado.');
        return;
      }
      
      // Definir datas de início e fim do período de teste
      const startDate = new Date();
      const endDate = addDays(startDate, TRIAL_DAYS);
      
      const { error } = await supabase
        .from('company_config')
        .update({ 
          plan_type: 'trial',
          trial_start_date: startDate.toISOString(),
          trial_end_date: endDate.toISOString(),
          webhook_url: DEFAULT_WEBHOOK_URL
        })
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      toast.success(`Período de teste de ${TRIAL_DAYS} dias iniciado com sucesso!`);
      
      // Atualizar os dados do plano
      setPlanData({
        ...planData,
        planType: 'trial',
        trialStartDate: startDate.toISOString(),
        trialEndDate: endDate.toISOString(),
        webhookUrl: DEFAULT_WEBHOOK_URL
      });
      
      // Chamar callback de atualização, se fornecido
      if (onUpgrade) onUpgrade();
      
    } catch (error) {
      console.error('Erro ao iniciar período de teste:', error);
      toast.error('Não foi possível iniciar o período de teste.');
    } finally {
      setSaving(false);
      setStartTrialDialogOpen(false);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return dateString;
    }
  };
  
  const isTrialActive = () => {
    if (planData.planType !== 'trial') return false;
    if (!planData.trialEndDate) return false;
    
    try {
      const endDate = parseISO(planData.trialEndDate);
      return isAfter(endDate, new Date());
    } catch (e) {
      console.error('Erro ao verificar status do trial:', e);
      return false;
    }
  };
  
  const getRemainingDays = () => {
    if (!planData.trialEndDate) return 0;
    
    try {
      const endDate = parseISO(planData.trialEndDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error('Erro ao calcular dias restantes:', e);
      return 0;
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Carregando informações do plano...</div>;
  }
  
  const isLimitWarning = planData.planType === 'free' && monthlyCreationsCount >= 30 && monthlyCreationsCount < 60;
  const isLimitReached = planData.planType === 'free' && monthlyCreationsCount >= 60;
  const isTrialExpiringSoon = isTrialActive() && getRemainingDays() <= 2;
  const remainingDays = getRemainingDays();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4">
        <Crown className={`h-5 w-5 mt-1 ${planData.planType !== 'free' ? 'text-yellow-500' : 'text-gray-400'}`} />
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Plano</CardTitle>
            <Badge 
              variant={planData.planType !== 'free' ? 'default' : 'outline'} 
              className={planData.planType === 'pro' ? 'bg-yellow-500 hover:bg-yellow-500/90' : 
                        planData.planType === 'trial' ? 'bg-blue-500 hover:bg-blue-500/90' : ''}
            >
              {planData.planType === 'pro' ? 'PRO' : 
               planData.planType === 'trial' ? 'TESTE' : 'FREE'}
            </Badge>
          </div>
          <CardDescription>Gerencie seu plano e recursos</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {planData.planType === 'free' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Uso mensal</div>
                <div className="text-sm">
                  {monthlyCreationsCount} de {planData.monthlyLimit} agendamentos
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    isLimitReached ? 'bg-red-600' : isLimitWarning ? 'bg-yellow-500' : 'bg-blue-600'
                  }`} 
                  style={{ width: `${Math.min(100, (monthlyCreationsCount / planData.monthlyLimit) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            {isLimitReached && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você atingiu o limite de agendamentos do plano gratuito. Faça upgrade para o plano PRO para continuar recebendo agendamentos.
                </AlertDescription>
              </Alert>
            )}
            
            {!isLimitReached && isLimitWarning && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você está se aproximando do limite de agendamentos do plano gratuito. Considere fazer upgrade para o plano PRO para evitar interrupções.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Faça upgrade para o Plano PRO</h3>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Agendamentos ilimitados</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Integração com Webhook personalizado</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span>Seus clientes receberão notificações por e-mail e telefone sobre seus agendamentos</span>
                </li>
              </ul>
              
              <div className="mb-4 space-y-1">
                <div className="font-bold text-2xl">R$ 49,90</div>
                <div className="text-sm text-gray-500">por mês</div>
              </div>
              
              <div className="space-y-3">
                <Dialog open={startTrialDialogOpen} onOpenChange={setStartTrialDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      Experimentar GRÁTIS por {TRIAL_DAYS} dias
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Iniciar período de teste gratuito</DialogTitle>
                      <DialogDescription>
                        Experimente o plano PRO gratuitamente por {TRIAL_DAYS} dias, sem compromisso.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="font-semibold mb-2">Durante o período de teste você terá acesso a:</div>
                      <ul className="space-y-2 mb-4">
                        <li className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <span>Agendamentos ilimitados</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <span>Integração com Webhook personalizado</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <span>Notificações por e-mail e telefone para seus clientes</span>
                        </li>
                      </ul>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Após {TRIAL_DAYS} dias, seu plano voltará automaticamente para o gratuito, a menos que você faça o upgrade para o plano PRO.
                        </AlertDescription>
                      </Alert>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setStartTrialDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={startFreeTrial} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        {saving ? "Processando..." : `Começar período de teste de ${TRIAL_DAYS} dias`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={upgradePlanDialogOpen} onOpenChange={setUpgradePlanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Fazer upgrade para PRO
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fazer upgrade para o plano PRO</DialogTitle>
                      <DialogDescription>
                        Você está prestes a atualizar seu plano para PRO, com agendamentos ilimitados e recursos avançados.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="font-semibold mb-2">O plano PRO inclui:</div>
                      <ul className="space-y-2 mb-4">
                        <li className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <span>Agendamentos ilimitados</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <span>Integração com Webhook personalizado</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          <span>Seus clientes receberão notificações por e-mail e telefone sobre seus agendamentos</span>
                        </li>
                      </ul>
                      <div className="font-bold text-2xl mb-1">R$ 49,90</div>
                      <div className="text-sm text-gray-500 mb-4">por mês</div>
                      <p className="text-sm text-gray-500">
                        Esta é apenas uma demonstração. Em um sistema real, aqui você seria redirecionado para uma página de pagamento.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUpgradePlanDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleUpgradeToPro} disabled={saving}>
                        {saving ? "Processando..." : "Confirmar upgrade para PRO"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">Precisa de ajuda? Entre em contato:</p>
              <a 
                href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-agendafacil-600 hover:underline font-medium"
              >
                WhatsApp de Suporte: {SUPPORT_WHATSAPP}
              </a>
            </div>
          </>
        )}
        
        {planData.planType === 'trial' && (
          <>
            <Alert className={isTrialExpiringSoon ? 'border-yellow-500' : 'border-blue-500'}>
              <Calendar className="h-4 w-4 text-blue-500" />
              <AlertDescription className="flex flex-col">
                <span className="font-medium">
                  Você está no período de teste gratuito do plano PRO.
                </span>
                <span>
                  {remainingDays > 0 ? (
                    <>Seu período de teste termina em <span className="font-semibold">{remainingDays} dias</span> ({formatDate(planData.trialEndDate)})</>
                  ) : (
                    <>Seu período de teste termina hoje</>
                  )}
                </span>
              </AlertDescription>
            </Alert>
            
            {isTrialExpiringSoon && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Seu período de teste está acabando. Faça upgrade para o plano PRO para continuar com acesso ilimitado.
                </AlertDescription>
              </Alert>
            )}
            
            <Dialog open={upgradePlanDialogOpen} onOpenChange={setUpgradePlanDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mt-2">
                  Atualizar para plano PRO
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fazer upgrade para o plano PRO</DialogTitle>
                  <DialogDescription>
                    Mantenha todas as vantagens do seu período de teste convertendo para o plano PRO completo.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="font-semibold mb-2">O plano PRO inclui:</div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span>Agendamentos ilimitados</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span>Integração com Webhook personalizado</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span>Seus clientes receberão notificações por e-mail e telefone sobre seus agendamentos</span>
                    </li>
                  </ul>
                  <div className="font-bold text-2xl mb-1">R$ 49,90</div>
                  <div className="text-sm text-gray-500 mb-4">por mês</div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUpgradePlanDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleUpgradeToPro} disabled={saving}>
                    {saving ? "Processando..." : "Confirmar upgrade para PRO"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <div className="flex items-center gap-2 mb-4 mt-6">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Agendamentos ilimitados</span>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Seus clientes receberão notificações por e-mail e telefone sobre seus agendamentos</span>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="webhook-url">Webhook URL (Configuração automática)</Label>
              <Input 
                id="webhook-url" 
                value={webhookUrl} 
                readOnly
                disabled
                className="font-mono text-sm bg-gray-50"
              />
              <p className="text-sm text-gray-500">
                Este webhook está configurado automaticamente para receber os dados dos novos agendamentos.
              </p>
              <p className="text-sm text-muted-foreground">
                Os agendamentos feitos pelo seu cliente serão enviados automaticamente para o webhook.
              </p>
            </div>
            
            <div className="pt-4 mt-4 border-t">
              <p className="text-sm text-gray-500">Precisa de ajuda? Entre em contato:</p>
              <a 
                href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-agendafacil-600 hover:underline font-medium"
              >
                WhatsApp de Suporte: {SUPPORT_WHATSAPP}
              </a>
            </div>
          </>
        )}
        
        {planData.planType === 'pro' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Agendamentos ilimitados</span>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Seus clientes receberão notificações por e-mail e telefone sobre seus agendamentos</span>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="webhook-url">Webhook URL (Configuração automática)</Label>
              <Input 
                id="webhook-url" 
                value={webhookUrl} 
                readOnly
                disabled
                className="font-mono text-sm bg-gray-50"
              />
              <p className="text-sm text-gray-500">
                Este webhook está configurado automaticamente para receber os dados dos novos agendamentos.
              </p>
              <p className="text-sm text-muted-foreground">
                Os agendamentos feitos pelo seu cliente serão enviados automaticamente para o webhook.
              </p>
            </div>
            
            <div className="pt-4 mt-4 border-t">
              <p className="text-sm text-gray-500">Precisa de ajuda? Entre em contato:</p>
              <a 
                href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-agendafacil-600 hover:underline font-medium"
              >
                WhatsApp de Suporte: {SUPPORT_WHATSAPP}
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanSettings;
