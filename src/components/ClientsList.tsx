import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { format } from "date-fns";

interface Client {
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_count: number;
  last_appointment: string;
}

const ClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Get unique clients with their most recent appointment and count
      const { data, error } = await supabase.rpc('get_clients_with_stats', {
        p_user_id: session.user.id
      });

      if (error) {
        console.error("RPC error:", error);
        throw error;
      }

      if (data && Array.isArray(data)) {
        // Format the data from the RPC function
        const formattedData: Client[] = data.map((client: any) => ({
          client_name: client.client_name,
          client_email: client.client_email,
          client_phone: client.client_phone,
          appointment_count: Number(client.appointment_count),
          last_appointment: client.last_appointment
        }));
        
        setClients(formattedData);
      } else {
        // Fallback to direct query
        const { data: appointments, error: appointmentsError } = await supabase
          .from("appointments")
          .select("client_name, client_email, client_phone, scheduled_at")
          .eq("user_id", session.user.id)
          .order("scheduled_at", { ascending: false });

        if (appointmentsError) throw appointmentsError;

        if (!appointments || !Array.isArray(appointments)) {
          setClients([]);
          return;
        }

        // Manual aggregation of client data
        const clientMap = new Map<string, Client>();
        
        appointments.forEach(apt => {
          if (!apt || !apt.client_email) return;
          
          const email = apt.client_email;
          
          if (!clientMap.has(email)) {
            clientMap.set(email, {
              client_name: apt.client_name || '',
              client_email: apt.client_email,
              client_phone: apt.client_phone || '',
              appointment_count: 1,
              last_appointment: apt.scheduled_at
            });
          } else {
            const client = clientMap.get(email)!;
            client.appointment_count += 1;
            
            // Keep the most recent appointment
            if (apt.scheduled_at && new Date(apt.scheduled_at) > new Date(client.last_appointment)) {
              client.last_appointment = apt.scheduled_at;
            }
          }
        });
        
        setClients(Array.from(clientMap.values()));
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar lista de clientes");
      // Ensure clients is set to an empty array when there's an error
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando clientes...</div>;
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-gray-50">
        <p className="text-gray-500">Nenhum cliente encontrado.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-center">Agendamentos</TableHead>
              <TableHead className="text-right">Último agendamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{client.client_name}</TableCell>
                <TableCell>{client.client_email}</TableCell>
                <TableCell>{client.client_phone}</TableCell>
                <TableCell className="text-center">{client.appointment_count}</TableCell>
                <TableCell className="text-right">
                  {client.last_appointment && format(new Date(client.last_appointment), "dd/MM/yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClientsList;
