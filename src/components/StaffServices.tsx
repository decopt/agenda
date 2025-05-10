
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
  selected?: boolean;
}

interface StaffServicesProps {
  isOpen: boolean;
  staffId: string;
  staffName: string;
  staffAvatar?: string | null;
  onClose: () => void;
}

const StaffServices = ({ isOpen, staffId, staffName, staffAvatar, onClose }: StaffServicesProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  
  useEffect(() => {
    if (isOpen && staffId) {
      fetchServices();
    }
  }, [isOpen, staffId]);
  
  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Get all services
      const { data: allServices, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("active", true)
        .order("name");
        
      if (servicesError) throw servicesError;
      
      if (!allServices) {
        setServices([]);
        return;
      }
      
      // Get staff services
      const { data: staffServices, error: staffServicesError } = await supabase
        .from("staff_services")
        .select("service_id")
        .eq("staff_id", staffId);
        
      if (staffServicesError) throw staffServicesError;
      
      // Mark selected services
      const staffServiceIds = staffServices?.map(s => s.service_id) || [];
      
      const servicesWithSelected = allServices.map(service => ({
        id: service.id,
        name: service.name || "",
        duration: service.duration,
        price: service.price,
        selected: staffServiceIds.includes(service.id)
      }));
      
      setServices(servicesWithSelected);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleService = (serviceId: string) => {
    setServices(services.map(service => 
      service.id === serviceId 
        ? { ...service, selected: !service.selected } 
        : service
    ));
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Get selected services
      const selectedServices = services.filter(s => s.selected).map(s => s.id);
      const notSelectedServices = services.filter(s => !s.selected).map(s => s.id);
      
      // Delete services that are not selected anymore
      if (notSelectedServices.length > 0) {
        const { error: deleteError } = await supabase
          .from("staff_services")
          .delete()
          .eq("staff_id", staffId)
          .in("service_id", notSelectedServices);
          
        if (deleteError) throw deleteError;
      }
      
      // Insert new selected services
      if (selectedServices.length > 0) {
        // First get existing associations to avoid duplicates
        const { data: existingAssociations, error: existingError } = await supabase
          .from("staff_services")
          .select("service_id")
          .eq("staff_id", staffId);
          
        if (existingError) throw existingError;
        
        const existingServiceIds = existingAssociations?.map(a => a.service_id) || [];
        
        // Filter out services that are already associated
        const newServices = selectedServices.filter(id => !existingServiceIds.includes(id));
        
        if (newServices.length > 0) {
          const servicesToInsert = newServices.map(serviceId => ({
            staff_id: staffId,
            service_id: serviceId
          }));
          
          const { error: insertError } = await supabase
            .from("staff_services")
            .insert(servicesToInsert);
            
          if (insertError) throw insertError;
        }
      }
      
      toast.success("Serviços atualizados com sucesso");
      onClose();
    } catch (error) {
      console.error("Error saving staff services:", error);
      toast.error("Erro ao salvar serviços");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {staffAvatar ? (
                <AvatarImage src={staffAvatar} alt={staffName} />
              ) : (
                <AvatarFallback>{getInitials(staffName)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              Serviços de {staffName}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="text-center py-8">Carregando serviços...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum serviço cadastrado.</p>
              <p className="text-sm mt-2">Adicione serviços na seção "Serviços" para poder associá-los aos colaboradores.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-4">
                {services.map(service => (
                  <div 
                    key={service.id} 
                    className="flex items-center space-x-3 border rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleToggleService(service.id)}
                  >
                    <Checkbox 
                      checked={service.selected} 
                      onCheckedChange={() => handleToggleService(service.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{service.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-gray-50">
                          {service.duration} min
                        </Badge>
                        {service.price && (
                          <Badge variant="outline" className="bg-gray-50 text-green-700">
                            R$ {service.price.toFixed(2).replace(".", ",")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffServices;
