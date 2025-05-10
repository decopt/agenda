
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import ServiceForm from "@/components/ServiceForm";
import { useToast } from "@/components/ui/use-toast";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
  description: string | null;
}

const ServicesList = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchServices();
  }, []);
  
  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name");
        
      if (error) throw error;
      
      if (data) {
        const typedServices: Service[] = data.map(service => ({
          id: service.id,
          name: service.name || "",
          duration: service.duration,
          price: service.price,
          description: service.description
        }));
        setServices(typedServices);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({ 
        title: "Erro ao carregar serviços",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddService = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };
  
  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };
  
  const handleDeleteService = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Check if this service has any appointments
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        return toast({
          title: "Não é possível excluir",
          description: `Este serviço possui ${count} agendamento(s) associado(s).`,
          variant: "destructive"
        });
      }
      
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);
        
      if (error) throw error;
      
      setServices(services.filter(service => service.id !== id));
      toast({
        title: "Serviço excluído com sucesso"
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Erro ao excluir serviço",
        variant: "destructive"
      });
    }
  };
  
  const handleFormClose = (updated?: boolean) => {
    setIsFormOpen(false);
    if (updated) {
      fetchServices();
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Carregando serviços...</div>;
  }
  
  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={handleAddService}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar serviço
        </Button>
      </div>
      
      {services.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">Você ainda não cadastrou nenhum serviço.</p>
          <Button variant="outline" className="mt-4" onClick={handleAddService}>
            Criar primeiro serviço
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    <div className="text-right text-green-600 font-semibold">
                      {service.price ? `R$ ${service.price.toFixed(2).replace(".", ",")}` : "Gratuito"}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-gray-500">{service.duration} minutos</p>
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleEditService(service)}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {isFormOpen && (
        <ServiceForm 
          service={selectedService}
          isOpen={isFormOpen}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default ServicesList;
