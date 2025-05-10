
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import StaffForm from "@/components/StaffForm";

interface Staff {
  id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  active: boolean | null;
}

const StaffList = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  useEffect(() => {
    fetchStaff();
  }, []);
  
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name");
        
      if (error) throw error;
      
      if (data) {
        setStaff(data as Staff[]);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddStaff = () => {
    setSelectedStaff(null);
    setIsFormOpen(true);
  };
  
  const handleEditStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsFormOpen(true);
  };
  
  const handleToggleActive = async (id: string, currentActive: boolean | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { error } = await supabase
        .from("staff")
        .update({ active: !currentActive })
        .eq("id", id)
        .eq("user_id", session.user.id);
        
      if (error) throw error;
      
      setStaff(staff.map(s => s.id === id ? { ...s, active: !currentActive } : s));
      toast.success(`Colaborador ${!currentActive ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error("Error toggling staff active status:", error);
      toast.error("Erro ao atualizar status do colaborador");
    }
  };
  
  const handleDeleteStaff = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Check if this staff has any appointments
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('staff_id', id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        return toast.error(`Este colaborador possui ${count} agendamento(s) associado(s).`,
          { description: "Cancele ou reatribua os agendamentos antes de excluir." });
      }
      
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);
        
      if (error) throw error;
      
      setStaff(staff.filter(s => s.id !== id));
      toast.success("Colaborador excluído com sucesso");
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Erro ao excluir colaborador");
    }
  };
  
  const handleFormClose = (updated?: boolean) => {
    setIsFormOpen(false);
    if (updated) {
      fetchStaff();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
  
  if (loading) {
    return <div className="text-center py-8">Carregando equipe...</div>;
  }
  
  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={handleAddStaff}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar colaborador
        </Button>
      </div>
      
      {staff.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">Você ainda não cadastrou nenhum colaborador.</p>
          <Button variant="outline" className="mt-4" onClick={handleAddStaff}>
            Criar primeiro colaborador
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {staff.map((staffMember) => (
            <Card key={staffMember.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      {staffMember.avatar_url ? (
                        <AvatarImage src={staffMember.avatar_url} alt={staffMember.name} />
                      ) : (
                        <AvatarFallback>{getInitials(staffMember.name)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{staffMember.name}</h3>
                      {staffMember.position && (
                        <p className="text-sm text-gray-500">{staffMember.position}</p>
                      )}
                      <div className="mt-1">
                        {staffMember.active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {staffMember.bio && (
                    <p className="text-sm text-gray-600 mb-4">{staffMember.bio}</p>
                  )}
                  
                  <div className="flex flex-col space-y-1 mb-4">
                    {staffMember.email && (
                      <p className="text-sm">
                        <span className="font-semibold">Email:</span> {staffMember.email}
                      </p>
                    )}
                    {staffMember.phone && (
                      <p className="text-sm">
                        <span className="font-semibold">Telefone:</span> {staffMember.phone}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      size="sm" 
                      variant={staffMember.active ? "destructive" : "default"}
                      onClick={() => handleToggleActive(staffMember.id, staffMember.active)}
                    >
                      {staffMember.active ? (
                        <><X className="h-4 w-4 mr-1" /> Desativar</>
                      ) : (
                        <><Check className="h-4 w-4 mr-1" /> Ativar</>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditStaff(staffMember)}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteStaff(staffMember.id)}>
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
        <StaffForm 
          staff={selectedStaff}
          isOpen={isFormOpen}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default StaffList;
