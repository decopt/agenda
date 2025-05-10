import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import StaffServices from "./StaffServices";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const serviceSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  duration: z.coerce.number().min(5, "Duração mínima de 5 minutos").max(480, "Duração máxima de 8 horas"),
  price: z.coerce.number().min(0, "Preço não pode ser negativo").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal(""))
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  service: {
    id: string;
    name: string;
    duration: number;
    price: number | null;
    description: string | null;
  } | null;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

const ServiceForm = ({ service, isOpen, onClose }: ServiceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || "",
      duration: service?.duration || 60,
      price: service?.price || "",
      description: service?.description || ""
    }
  });
  
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        duration: service.duration,
        price: service.price || "",
        description: service.description || ""
      });
    } else {
      form.reset({
        name: "",
        duration: 60,
        price: "",
        description: ""
      });
    }
  }, [service, form]);
  
  // Staff services management
  const [isStaffServicesOpen, setIsStaffServicesOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState<string>("");
  const [selectedStaffAvatar, setSelectedStaffAvatar] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Array<{id: string, name: string, avatar_url: string | null}>>([]);
  
  useEffect(() => {
    if (isOpen && service) {
      form.reset({
        name: service.name,
        duration: service.duration,
        price: service.price || "",
        description: service.description || ""
      });
      
      fetchStaff();
    }
  }, [isOpen, service]);
  
  // Fetch staff for the service
  const fetchStaff = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from("staff")
        .select("id, name, avatar_url")
        .eq("user_id", session.user.id)
        .eq("active", true)
        .order("name");
        
      if (error) throw error;
      
      if (data) {
        setStaffList(data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };
  
  const handleOpenStaffServices = (staffId: string, staffName: string, staffAvatar: string | null) => {
    setSelectedStaffId(staffId);
    setSelectedStaffName(staffName);
    setSelectedStaffAvatar(staffAvatar);
    setIsStaffServicesOpen(true);
  };
  
  const onSubmit = async (data: ServiceFormValues) => {
    try {
      setIsSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const serviceData = {
        name: data.name,
        duration: data.duration,
        price: data.price === "" ? null : data.price,
        description: data.description || null,
        user_id: session.user.id
      };
      
      let error;
      
      if (service) {
        // Update existing service
        const { error: updateError } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", service.id)
          .eq("user_id", session.user.id);
          
        error = updateError;
      } else {
        // Create new service
        const { error: insertError } = await supabase
          .from("services")
          .insert(serviceData);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      toast({
        title: service ? "Serviço atualizado com sucesso" : "Serviço criado com sucesso"
      });
      
      onClose(true);
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: "Erro ao salvar serviço",
        description: "Verifique os dados e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{service ? "Editar serviço" : "Adicionar serviço"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do serviço *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Corte de cabelo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="5" max="480" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva os detalhes do serviço"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onClose()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          
          {/* Staff section (only show for existing services) */}
          {service && service.id && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Atribuir colaboradores</h3>
              
              {staffList.length === 0 ? (
                <div className="text-center py-4 border rounded-md bg-gray-50">
                  <p className="text-gray-500">Você ainda não cadastrou nenhum colaborador.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => {
                      onClose();
                      // Redirect to staff tab
                      window.location.href = "/dashboard?tab=equipe";
                    }}
                  >
                    Gerenciar equipe
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {staffList.map((staff) => (
                    <div 
                      key={staff.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {staff.avatar_url ? (
                            <AvatarImage src={staff.avatar_url} />
                          ) : (
                            <AvatarFallback>
                              {staff.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>{staff.name}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenStaffServices(staff.id, staff.name, staff.avatar_url)}
                      >
                        Atribuir serviços
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Staff Services Dialog */}
      {isStaffServicesOpen && selectedStaffId && (
        <StaffServices
          isOpen={isStaffServicesOpen}
          staffId={selectedStaffId}
          staffName={selectedStaffName}
          staffAvatar={selectedStaffAvatar}
          onClose={() => setIsStaffServicesOpen(false)}
        />
      )}
    </>
  );
};

export default ServiceForm;
