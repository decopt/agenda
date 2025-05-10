import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes, isBefore, setHours, setMinutes, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Listbox, ListboxItem, ListboxTrigger, ListboxContent } from "@/components/ui/listbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  phone: z.string().min(10, {
    message: "Por favor, insira um telefone válido.",
  }),
  notes: z.string().optional().or(z.literal("")),
});

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
}

interface AvailableHour {
  start_time: string;
  end_time: string;
  lunch_break_start: string | null;
  lunch_break_end: string | null;
  weekday: string;
}

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  customUrl: string;
  userId: string | undefined;
  onAppointmentCreated?: () => void;
  appointment?: any; // Adding appointment prop to support editing
}

interface Staff {
  id: string;
  name: string;
  avatar_url: string | null;
}

export const AppointmentForm = ({ 
  isOpen, 
  onClose, 
  customUrl, 
  userId,
  onAppointmentCreated,
  appointment
}: AppointmentFormProps) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableHours, setAvailableHours] = useState<AvailableHour[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHours, setLoadingHours] = useState(false);
  
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(undefined);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
  
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setScheduledDateTime(null);
      setSelectedStaffId(undefined);
      fetchServices();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableHours(selectedDate);
    }
  }, [selectedDate]);
  
  useEffect(() => {
    if (selectedTime && selectedDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDateTime = setHours(setMinutes(selectedDate, minutes), hours);
      setScheduledDateTime(newDateTime);
    }
  }, [selectedTime, selectedDate]);
  
  useEffect(() => {
    if (selectedService) {
      fetchStaffForService(selectedService.id);
    } else {
      fetchAllStaff();
    }
  }, [selectedService]);

  const fetchServices = async () => {
    try {
      if (!userId) return;
      
      setLoading(true);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('name');
        
      if (error) throw error;
      
      if (data) {
        setServices(data as Service[]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailableHours = async (date: Date) => {
    try {
      if (!userId) return;
      
      setLoadingHours(true);
      
      const weekday = format(date, 'EEEE', { locale: ptBR });
      const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      
      const { data, error } = await supabase
        .from('available_hours')
        .select('*')
        .eq('user_id', userId)
        .eq('weekday', formattedWeekday);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAvailableHours(data);
      } else {
        // Se não houver horários configurados, usar horário padrão
        const defaultHours = [{
          weekday: formattedWeekday,
          start_time: '09:00',
          end_time: '18:00',
          lunch_break_start: '12:00',
          lunch_break_end: '13:00'
        }];
        setAvailableHours(defaultHours);
      }
    } catch (error) {
      console.error('Error fetching available hours:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setLoadingHours(false);
    }
  };
  
  const fetchAllStaff = async () => {
    try {
      if (!userId) return;
      
      setLoadingStaff(true);
      
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, avatar_url')
        .eq('user_id', userId)
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        setStaffMembers(data as Staff[]);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };
  
  const fetchStaffForService = async (serviceId: string) => {
    try {
      if (!userId) return;
      
      setLoadingStaff(true);
      
      // First approach: get staff who can provide this service
      const { data: serviceStaff, error: serviceError } = await supabase
        .from('staff_services')
        .select('staff_id')
        .eq('service_id', serviceId);
      
      if (serviceError) throw serviceError;
      
      if (serviceStaff && serviceStaff.length > 0) {
        // Get staff details
        const staffIds = serviceStaff.map(s => s.staff_id);
        
        const { data, error } = await supabase
          .from('staff')
          .select('id, name, avatar_url')
          .in('id', staffIds)
          .eq('active', true)
          .order('name');
        
        if (error) throw error;
        
        if (data) {
          setStaffMembers(data as Staff[]);
        }
      } else {
        // Fallback: if no staff is assigned to this service, show all active staff
        fetchAllStaff();
      }
    } catch (error) {
      console.error('Error fetching staff for service:', error);
      // Fallback to all staff
      fetchAllStaff();
    } finally {
      setLoadingStaff(false);
    }
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });
  
  const handleSubmitAppointment = async (values: any) => {
    try {
      setSubmitting(true);
      
      if (!selectedService) {
        toast.error('Por favor, selecione um serviço');
        return;
      }
      
      if (!scheduledDateTime) {
        toast.error('Por favor, selecione uma data e hora');
        return;
      }
      
      if (isBefore(scheduledDateTime, new Date())) {
        toast.error('Não é possível agendar para uma data/hora passada');
        return;
      }
      
      if (!userId) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Verificar conflitos de horário
      const startOfDay = new Date(scheduledDateTime);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(scheduledDateTime);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data: existingAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("scheduled_at, services (duration)")
        .eq("user_id", userId)
        .eq("staff_id", selectedStaffId)
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString())
        .eq("status", "confirmed");
      
      if (fetchError) throw fetchError;
      
      // Verificar se há conflito com outros agendamentos
      const hasConflict = existingAppointments?.some(apt => {
        const aptTime = new Date(apt.scheduled_at);
        const aptEndTime = new Date(aptTime);
        aptEndTime.setMinutes(aptTime.getMinutes() + (apt.services?.duration || 30));
        
        const newAptEndTime = new Date(scheduledDateTime);
        newAptEndTime.setMinutes(scheduledDateTime.getMinutes() + selectedService.duration);
        
        return (
          (scheduledDateTime >= aptTime && scheduledDateTime < aptEndTime) || // Novo agendamento começa durante outro
          (newAptEndTime > aptTime && newAptEndTime <= aptEndTime) || // Novo agendamento termina durante outro
          (scheduledDateTime <= aptTime && newAptEndTime >= aptEndTime) // Novo agendamento contém outro
        );
      });
      
      if (hasConflict) {
        toast.error('Este horário já está ocupado para o colaborador selecionado');
        return;
      }
      
      // Format to ISO string but preserving the local time information
      const year = scheduledDateTime.getFullYear();
      const month = String(scheduledDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(scheduledDateTime.getDate()).padStart(2, '0');
      const hours = String(scheduledDateTime.getHours()).padStart(2, '0');
      const minutes = String(scheduledDateTime.getMinutes()).padStart(2, '0');
      
      // Create an ISO string with the exact time selected
      const isoString = `${year}-${month}-${day}T${hours}:${minutes}:00`;
      
      // Final appointment data
      const appointmentData = {
        user_id: userId,
        client_name: values.name,
        client_email: values.email,
        client_phone: values.phone.replace(/\D/g, ''),
        scheduled_at: isoString,
        service_id: selectedService?.id,
        servico: selectedService?.name,
        notes: values.notes,
        staff_id: selectedStaffId || null,
        status: "confirmed"
      };
      
      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);
      
      if (error) throw error;
      
      toast.success('Agendamento realizado com sucesso!');
      
      // Notify parent component about the new appointment
      if (onAppointmentCreated) {
        onAppointmentCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Erro ao realizar agendamento');
    } finally {
      setSubmitting(false);
    }
  };
  
  const isValidTime = (time: string) => {
    if (!selectedDate) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    
    // Can't book in the past
    if (selectedDateTime < now) {
      return false;
    }
    
    // Check if the selected time is within the service duration
    if (!selectedService) return false;
    
    const endTime = addMinutes(selectedDateTime, selectedService.duration);
    
    // Check if the selected time is within the available hours
    const selectedDay = format(selectedDate, 'EEEE', { locale: ptBR });
    const formattedSelectedDay = selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);
    
    const availableHour = availableHours.find(hour => hour.weekday === formattedSelectedDay);
    
    if (!availableHour) return false;
    
    const [startTimeHours, startTimeMinutes] = availableHour.start_time.split(':').map(Number);
    const [endTimeHours, endTimeMinutes] = availableHour.end_time.split(':').map(Number);
    
    const availableStartTime = new Date(selectedDate);
    availableStartTime.setHours(startTimeHours, startTimeMinutes, 0, 0);
    
    const availableEndTime = new Date(selectedDate);
    availableEndTime.setHours(endTimeHours, endTimeMinutes, 0, 0);
    
    // Check if the time is within business hours
    const isWithinBusinessHours = selectedDateTime >= availableStartTime && endTime <= availableEndTime;
    
    // Check if the time is during lunch break
    let isDuringLunchBreak = false;
    if (availableHour.lunch_break_start && availableHour.lunch_break_end) {
      const [lunchStartHours, lunchStartMinutes] = availableHour.lunch_break_start.split(':').map(Number);
      const [lunchEndHours, lunchEndMinutes] = availableHour.lunch_break_end.split(':').map(Number);
      
      const lunchStartTime = new Date(selectedDate);
      lunchStartTime.setHours(lunchStartHours, lunchStartMinutes, 0, 0);
      
      const lunchEndTime = new Date(selectedDate);
      lunchEndTime.setHours(lunchEndHours, lunchEndMinutes, 0, 0);
      
      isDuringLunchBreak = selectedDateTime >= lunchStartTime && endTime <= lunchEndTime;
    }
    
    return isWithinBusinessHours && !isDuringLunchBreak;
  };
  
  // Helper to get staff initials
  const getStaffInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
  
  return (
    <div className="max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitAppointment)} className="space-y-6">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold mb-4">Escolha o serviço</h2>
              
              {loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando serviços...</p>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-10">
                  <p>Nenhum serviço disponível.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedService?.id === service.id 
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedService(service)}
                      >
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.duration} minutos</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      disabled={!selectedService}
                      onClick={() => setStep(2)}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Step 2: Select Staff */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold mb-4">Escolha o profissional</h2>
              
              {loadingStaff ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando profissionais...</p>
                </div>
              ) : staffMembers.length === 0 ? (
                <div className="text-center py-10">
                  <p>Nenhum profissional disponível para este serviço.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setStep(1)}
                  >
                    Voltar para serviços
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {staffMembers.map((staff) => (
                      <div 
                        key={staff.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedStaffId === staff.id 
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedStaffId(staff.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {staff.avatar_url ? (
                              <AvatarImage src={staff.avatar_url} alt={staff.name} />
                            ) : (
                              <AvatarFallback>{getStaffInitials(staff.name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{staff.name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Step 3: Select Date */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold mb-4">Escolha a data</h2>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      isBefore(date, new Date())
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button
                  type="button"
                  disabled={!selectedDate}
                  onClick={() => selectedDate && setStep(4)}
                >
                  Continuar
                </Button>
              </div>
            </>
          )}
          
          {/* Step 4: Select Time */}
          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold mb-4">Escolha o horário</h2>
              
              {loadingHours ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando horários...</p>
                </div>
              ) : availableHours.length === 0 ? (
                <div className="text-center py-10">
                  <p>Nenhum horário disponível para este dia.</p>
                </div>
              ) : (
                <Listbox value={selectedTime} onValueChange={setSelectedTime}>
                  <ListboxTrigger className="w-full">
                    {selectedTime ? selectedTime : 'Selecione o horário'}
                  </ListboxTrigger>
                  <ListboxContent>
                    {availableHours.map((hour) => {
                      const [startHour, startMinute] = hour.start_time.split(':').map(Number);
                      const [endHour, endMinute] = hour.end_time.split(':').map(Number);
                      
                      const startTime = new Date(selectedDate as Date);
                      startTime.setHours(startHour, startMinute, 0, 0);
                      
                      const endTime = new Date(selectedDate as Date);
                      endTime.setHours(endHour, endMinute, 0, 0);
                      
                      const interval = selectedService?.duration || 60;
                      const timeSlots = [];
                      let currentTime = startTime;
                      
                      while (currentTime <= endTime) {
                        const time = format(currentTime, 'HH:mm');
                        
                        if (isValidTime(time)) {
                          timeSlots.push(time);
                        }
                        
                        currentTime = addMinutes(currentTime, interval);
                      }
                      
                      return timeSlots.map((time) => (
                        <ListboxItem key={time} value={time}>
                          {time}
                        </ListboxItem>
                      ));
                    })}
                  </ListboxContent>
                </Listbox>
              )}
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  Voltar
                </Button>
                <Button
                  type="button"
                  disabled={!selectedTime}
                  onClick={() => selectedTime && setStep(5)}
                >
                  Continuar
                </Button>
              </div>
            </>
          )}
          
          {/* Step 5: Enter Customer Data */}
          {step === 5 && (
            <>
              <h2 className="text-xl font-semibold mb-4">Seus dados</h2>
              
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
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(4)}>
                  Voltar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Enviando..." : "Confirmar agendamento"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
      
      {/* Confirmation Modal */}
      {/* You can open the modal using the server side code above */}
      {/* <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tem certeza?</DialogTitle>
            <DialogDescription>
              Seu agendamento está prestes a ser confirmado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input type="text" id="name" value="Teste" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default AppointmentForm;
