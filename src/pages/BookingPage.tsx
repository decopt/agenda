import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AlertCircle, Calendar as CalendarIcon, Check, Clock, MapPin, User, Mail, Phone, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover } from "@/components/ui/popover";
import { PopoverTrigger } from "@/components/ui/popover";
import { PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
  description: string | null;
}

interface Staff {
  id: string;
  name: string;
  position: string | null;
  avatar_url: string | null;
}

interface AvailableHour {
  weekday: string;
  start_time: string;
  end_time: string;
  lunch_break_start: string | null;
  lunch_break_end: string | null;
}

interface CompanyProfile {
  id: string;
  company_name: string;
  responsible_name: string;
  custom_url: string;
  logo_url: string | null;
}

const BookingPage = () => {
  const { customUrl } = useParams<{ customUrl: string }>();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [availableHours, setAvailableHours] = useState<AvailableHour[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyLimit, setCompanyLimit] = useState(false);
  
  // Form values
  const [service, setService] = useState<string | null>(null);
  const [staff, setStaff] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingComplete, setBookingComplete] = useState(false);
  
  useEffect(() => {
    if (customUrl) {
      loadCompanyData();
    }
  }, [customUrl]);
  
  useEffect(() => {
    if (date && company) {
      generateAvailableTimeSlots(date);
    }
  }, [date, company]);
  
  const loadCompanyData = async () => {
    try {
      setLoading(true);
      
      // Find company by custom URL
      const { data: companyData, error: companyError } = await supabase
        .from("profiles")
        .select("id, company_name, responsible_name, custom_url, logo_url")
        .eq("custom_url", customUrl)
        .single();
      
      if (companyError || !companyData) {
        navigate("/not-found");
        return;
      }
      
      setCompany(companyData);
      
      // Check if company is on the free plan and has reached limit
      const { data: configData } = await supabase
        .from("company_config")
        .select("plan_type, monthly_limit")
        .eq("user_id", companyData.id)
        .single();
      
      if (configData && configData.plan_type === "free") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { count: appointmentCount } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", companyData.id)
          .gte("created_at", startOfMonth.toISOString());
        
        if (appointmentCount !== null && appointmentCount >= configData.monthly_limit) {
          setCompanyLimit(true);
        }
      }
      
      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", companyData.id)
        .eq("active", true)
        .order("name");
      
      if (servicesError) throw servicesError;
      setServices(servicesData || []);
      
      // Load available hours - now handling the lunch_break fields correctly
      try {
        const { data: hoursData, error: hoursError } = await supabase
          .from("available_hours")
          .select("weekday, start_time, end_time, lunch_break_start, lunch_break_end")
          .eq("user_id", companyData.id);
        
        if (hoursError) throw hoursError;
        
        if (hoursData && hoursData.length > 0) {
          setAvailableHours(hoursData);
        } else {
          // Default hours if none set
          const defaultHours = [
            { weekday: "MONDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
            { weekday: "TUESDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
            { weekday: "WEDNESDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
            { weekday: "THURSDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
            { weekday: "FRIDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
          ];
          setAvailableHours(defaultHours);
        }
      } catch (hourError) {
        console.error("Error loading available hours:", hourError);
        // Fallback to default hours without lunch break fields
        const defaultHours = [
          { weekday: "MONDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
          { weekday: "TUESDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
          { weekday: "WEDNESDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
          { weekday: "THURSDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
          { weekday: "FRIDAY", start_time: "09:00", end_time: "18:00", lunch_break_start: null, lunch_break_end: null },
        ];
        setAvailableHours(defaultHours);
      }
    } catch (error) {
      console.error("Error loading company data:", error);
      toast.error("Erro ao carregar dados da empresa");
      navigate("/not-found");
    } finally {
      setLoading(false);
    }
  };
  
  const isInLunchBreak = (timeString: string, businessHours: AvailableHour): boolean => {
    if (!businessHours.lunch_break_start || !businessHours.lunch_break_end) {
      return false;
    }
    
    // Convert time strings to comparable values (minutes from midnight)
    const getMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const timeMinutes = getMinutes(timeString);
    const lunchStartMinutes = getMinutes(businessHours.lunch_break_start);
    const lunchEndMinutes = getMinutes(businessHours.lunch_break_end);
    
    return timeMinutes >= lunchStartMinutes && timeMinutes < lunchEndMinutes;
  };

  const generateAvailableTimeSlots = async (date: Date) => {
    try {
      if (!company || !staff) return;
      
      // Get the weekday of the selected date
      const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const weekday = weekdays[date.getDay()];
      
      // Find the business hours for this weekday
      const businessHours = availableHours.find(hour => hour.weekday === weekday);
      
      if (!businessHours) {
        setAvailableTimeSlots([]);
        return;
      }
      
      // Get existing appointments for this date and staff member
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data: existingAppointments, error } = await supabase
        .from("appointments")
        .select("scheduled_at, services (duration)")
        .eq("user_id", company.id)
        .eq("staff_id", staff)
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString())
        .eq("status", "confirmed");
      
      if (error) throw error;
      
      // Generate time slots with 30-minute intervals
      const [startHour, startMinute] = businessHours.start_time.split(":").map(Number);
      const [endHour, endMinute] = businessHours.end_time.split(":").map(Number);
      
      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      let endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      const slots: string[] = [];
      
      // Create 30-min slots
      while (currentTime < endTime) {
        const timeString = format(currentTime, "HH:mm");
        
        // Don't include past times for today
        const now = new Date();
        const slotDateTime = new Date(date);
        slotDateTime.setHours(currentTime.getHours(), currentTime.getMinutes());
        
        if (
          slotDateTime.getDate() === now.getDate() &&
          slotDateTime.getMonth() === now.getMonth() &&
          slotDateTime.getFullYear() === now.getFullYear() &&
          slotDateTime <= now
        ) {
          currentTime.setMinutes(currentTime.getMinutes() + 30);
          continue;
        }
        
        // Skip lunch break times
        if (isInLunchBreak(timeString, businessHours)) {
          currentTime.setMinutes(currentTime.getMinutes() + 30);
          continue;
        }
        
        // Check if this slot conflicts with existing appointments for this staff member
        const isAvailable = !existingAppointments?.some(apt => {
          const aptTime = new Date(apt.scheduled_at);
          const aptEndTime = new Date(aptTime);
          aptEndTime.setMinutes(aptTime.getMinutes() + (apt.services?.duration || 30));
          
          const slotTime = new Date(date);
          slotTime.setHours(currentTime.getHours(), currentTime.getMinutes());
          
          const slotEndTime = new Date(slotTime);
          slotEndTime.setMinutes(slotTime.getMinutes() + 30);
          
          return (
            (slotTime >= aptTime && slotTime < aptEndTime) || // Slot start during apt
            (slotEndTime > aptTime && slotEndTime <= aptEndTime) || // Slot end during apt
            (slotTime <= aptTime && slotEndTime >= aptEndTime) // Slot contains apt
          );
        });
        
        if (isAvailable) {
          slots.push(timeString);
        }
        
        // Move to next slot
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }
      
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error("Error generating time slots:", error);
      toast.error("Erro ao gerar horários disponíveis");
    }
  };
  
  const handleServiceSelect = async (serviceId: string) => {
    try {
      setLoading(true);
      setService(serviceId);
      
      // Load staff members for this service
      const { data: staffData, error: staffError } = await supabase
        .from("staff_services")
        .select(`
          staff:staff_id (
            id,
            name,
            position,
            avatar_url,
            active
          )
        `)
        .eq("service_id", serviceId)
        .eq("staff.active", true);
        
      if (staffError) throw staffError;
      
      if (staffData) {
        const staffList = staffData
          .map(item => item.staff)
          .filter(Boolean)
          .filter(staff => staff.active);
        setStaffMembers(staffList);
      }
      
      setStep(2);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error loading staff:", error);
      toast.error("Erro ao carregar profissionais disponíveis");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setTimeSlot(null);
  };
  
  const handleTimeSelect = (time: string) => {
    setTimeSlot(time);
    setStep(3);
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company || !service || !staff || !date || !timeSlot) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create a date object with the selected date and time
      const scheduledDate = new Date(date);
      const [hours, minutes] = timeSlot.split(":").map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      // Format to ISO string but preserving the local time information
      const year = scheduledDate.getFullYear();
      const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
      const day = String(scheduledDate.getDate()).padStart(2, '0');
      const formattedHours = String(hours).padStart(2, '0');
      const formattedMinutes = String(minutes).padStart(2, '0');
      
      // Create an ISO string with the exact time selected
      const isoString = `${year}-${month}-${day}T${formattedHours}:${formattedMinutes}:00`;
      
      // Create appointment using formatted string to preserve the time as entered
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          user_id: company.id,
          service_id: service,
          staff_id: staff,
          client_name: name,
          client_email: email,
          client_phone: phone,
          scheduled_at: isoString,
          status: "confirmed"
        })
        .select("id")
        .single();
      
      if (error) {
        if (error.message.includes("Limite de agendamentos")) {
          setCompanyLimit(true);
          throw new Error("Esta empresa atingiu o limite de agendamentos do plano gratuito");
        }
        throw error;
      }
      
      // Enviar notificação webhook para empresas com plano PRO
      try {
        console.log('Enviando notificação para o webhook da página pública:', data.id, company.id);
        const webhookResponse = await fetch(`${window.location.origin}/api/send-appointment-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            appointment_id: data.id,
            user_id: company.id
          })
        });
        
        const webhookResult = await webhookResponse.json();
        console.log('Resultado do webhook:', webhookResult);
      } catch (webhookError) {
        console.error("Erro ao enviar webhook:", webhookError);
        // Erro não bloqueante
      }
      
      setBookingComplete(true);
      setStep(4);
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast.error(error.message || "Erro ao criar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };
  
  const selectedService = service ? services.find(s => s.id === service) : null;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="text-center">
          <div className="animate-pulse inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-primary/10">
            <CalendarIcon className="h-8 w-8 text-primary/30" />
          </div>
          <p className="text-lg font-medium mb-2">Carregando agendamento</p>
          <p className="text-sm text-gray-500">Aguarde enquanto preparamos tudo para você.</p>
        </div>
      </div>
    );
  }
  
  if (companyLimit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Agendamentos indisponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Limite atingido</AlertTitle>
              <AlertDescription>
                Esta empresa atingiu o limite de agendamentos do plano gratuito.
              </AlertDescription>
            </Alert>
            <p className="text-center">
              Entre em contato diretamente com {company?.company_name} para agendar seu serviço.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col items-center mb-8 sm:mb-12">
          <div className="w-full max-w-[280px] h-[120px] mb-6 sm:mb-8">
            <img
              src={company?.logo_url}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 sm:mb-4">
            Agende seu horário
          </h1>
          <p className="text-gray-600 text-center max-w-md">
            Escolha um serviço e horário disponível para agendar seu atendimento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Selection */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Serviços disponíveis</h2>
            
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando serviços...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-10">
                <p>Nenhum serviço disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.duration} minutos</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendar and Time Selection */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Escolha a data e horário</h2>
            
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="mb-6">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      {date ? (
                        format(date, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        isBefore(date, new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {date && (
                <div className="space-y-4">
                  <h3 className="font-medium">Horários disponíveis</h3>
                  
                  {loading ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-gray-500">Carregando horários...</p>
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <p className="text-gray-500">Nenhum horário disponível para este dia.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableTimeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={timeSlot === time ? "default" : "outline"}
                          className="w-full"
                          onClick={() => handleTimeSelect(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Data Form */}
        {selectedService && date && timeSlot && (
          <div className="mt-8 sm:mt-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-6">Seus dados</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seuemail@email.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input placeholder="Ex: 5511999999999" type="tel" {...field} />
                            <p className="text-xs text-muted-foreground">
                              Exemplo: 
                              <br />
                              •  55 DDD999999999
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Alguma observação?"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Confirmar agendamento"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
