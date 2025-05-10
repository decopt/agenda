
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const accountSchema = z.object({
  responsible_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  company_name: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido")
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountSettingsProps {
  onUpdate?: () => void;
}

const AccountSettings = ({ onUpdate }: AccountSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      responsible_name: "",
      company_name: "",
      email: ""
    }
  });
  
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      // Get user email
      const email = session.user.email || "";
      
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('responsible_name, company_name')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) throw profileError;
      
      if (profileData) {
        form.reset({
          responsible_name: profileData.responsible_name || "",
          company_name: profileData.company_name || "",
          email
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar suas informações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (data: AccountFormValues) => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login novamente para continuar",
          variant: "destructive"
        });
        return;
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          responsible_name: data.responsible_name,
          company_name: data.company_name
        })
        .eq('id', session.user.id);
      
      if (profileError) throw profileError;
      
      // Update email if changed
      if (data.email !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        });
        
        if (emailError) throw emailError;
      }
      
      toast({
        title: "Informações atualizadas",
        description: "Seus dados foram salvos com sucesso"
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        title: "Erro ao atualizar informações",
        description: "Verifique os dados e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="responsible_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do responsável</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da empresa</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </Form>
  );
};

export default AccountSettings;
