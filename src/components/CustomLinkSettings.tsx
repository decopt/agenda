import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMobile } from "@/hooks/use-mobile";

const customLinkSchema = z.object({
  custom_url: z
    .string()
    .min(3, "O link deve ter pelo menos 3 caracteres")
    .max(30, "O link deve ter no máximo 30 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens")
});

type CustomLinkFormValues = z.infer<typeof customLinkSchema>;

interface CustomLinkSettingsProps {
  currentUrl: string;
  onUpdate: (url: string) => void;
}

const CustomLinkSettings = ({ currentUrl, onUpdate }: CustomLinkSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const form = useForm<CustomLinkFormValues>({
    resolver: zodResolver(customLinkSchema),
    defaultValues: {
      custom_url: currentUrl || ""
    }
  });
  
  // Atualiza o formulário quando currentUrl muda
  useEffect(() => {
    if (currentUrl) {
      form.reset({ custom_url: currentUrl });
    }
  }, [currentUrl, form]);
  
  // Sincronização de dados mais frequente e agressiva
  useEffect(() => {
    // Carregamento inicial imediato
    syncUrlFromDatabase();
    
    // Intervalo de sincronização frequente
    const interval = setInterval(() => {
      syncUrlFromDatabase();
    }, isMobile ? 300 : 3000); // Intervalo muito mais curto para dispositivos móveis
    
    return () => clearInterval(interval);
  }, [isMobile]);
  
  // Função dedicada para sincronizar URL do banco de dados
  const syncUrlFromDatabase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('custom_url')
          .eq('id', session.user.id)
          .single();
          
        if (data?.custom_url && data.custom_url !== form.getValues().custom_url) {
          console.log("Sincronizando URL do banco de dados:", data.custom_url);
          form.reset({ custom_url: data.custom_url });
          onUpdate(data.custom_url);
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar URL personalizado:", error);
    }
  };
  
  const checkUrlAvailability = async (url: string): Promise<boolean> => {
    try {
      setCheckingAvailability(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return false;
      
      // Check if URL is already taken by another user
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('custom_url', url)
        .neq('id', session.user.id);
      
      if (error) throw error;
      
      return count === 0; // URL is available if no other users have it
    } catch (error) {
      console.error("Erro ao verificar disponibilidade de URL:", error);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };
  
  const onSubmit = async (data: CustomLinkFormValues) => {
    try {
      setIsLoading(true);
      
      // If URL hasn't changed, no need to update
      if (data.custom_url === currentUrl) {
        toast({
          title: "Nenhuma alteração",
          description: "O link personalizado continua o mesmo."
        });
        return;
      }
      
      // Check if URL is available
      const isAvailable = await checkUrlAvailability(data.custom_url);
      
      if (!isAvailable) {
        form.setError("custom_url", {
          type: "manual",
          message: "Este link já está em uso. Por favor, escolha outro."
        });
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login novamente para continuar",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ custom_url: data.custom_url })
        .eq('id', session.user.id);
      
      if (error) throw error;
      
      toast({
        title: "Link atualizado",
        description: "Seu link personalizado foi salvo com sucesso"
      });
      
      onUpdate(data.custom_url);
      
      // Imediatamente sincronize novamente para confirmar atualização
      setTimeout(syncUrlFromDatabase, 500);
      
    } catch (error) {
      console.error("Erro ao atualizar link personalizado:", error);
      toast({
        title: "Erro ao atualizar link",
        description: "Verifique os dados e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Atualizamos a baseUrl para remover "booking/"
  const baseUrl = `${window.location.origin}/`;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="custom_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link personalizado</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <div className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 text-sm text-gray-500">
                    {baseUrl}
                  </div>
                  <Input
                    {...field}
                    className="rounded-l-none"
                    placeholder="sua-empresa"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="text-sm text-gray-500 mt-2">
          Este é o link que seus clientes usarão para agendar serviços.
        </div>
        
        <Button type="submit" disabled={isLoading || checkingAvailability}>
          {isLoading ? "Salvando..." : checkingAvailability ? "Verificando disponibilidade..." : "Salvar link"}
        </Button>
      </form>
    </Form>
  );
};

export default CustomLinkSettings;
