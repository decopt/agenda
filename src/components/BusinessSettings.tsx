
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { Check, X } from 'lucide-react';
import { PhoneInput } from './ui/phone-input';
import LogoUpload from './LogoUpload'; // Importar o componente de upload de logotipo

export default function BusinessSettings() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    company_name: '',
    responsible_name: '',
    phone: '',
    address: '',
    business_description: '',
    logo_url: null, // Adicionar campo para a URL do logotipo
  });
  const { toast } = useToast();
  const pollingTimeoutRef = useRef<number | null>(null);
  const isEditing = useRef(false);
  const initialLoadDone = useRef(false);

  // Função para buscar os dados do perfil
  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return;
      }

      console.info('Dados do perfil recuperados:', data);
      setProfile(data);
      
      // Só atualiza o formData se não estiver editando e se for a primeira carga
      // ou se os dados forem diferentes dos atuais
      if (!isEditing.current && 
          (!initialLoadDone.current || 
           JSON.stringify(formData) !== JSON.stringify({
             company_name: data.company_name || '',
             responsible_name: data.responsible_name || '',
             phone: data.phone || '',
             address: data.address || '',
             business_description: data.business_description || '',
             logo_url: data.logo_url || null,
           }))) {
        setFormData({
          company_name: data.company_name || '',
          responsible_name: data.responsible_name || '',
          phone: data.phone || '',
          address: data.address || '',
          business_description: data.business_description || '',
          logo_url: data.logo_url || null,
        });
        initialLoadDone.current = true;
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  // Iniciar a busca periódica do perfil - apenas na primeira renderização
  useEffect(() => {
    // Carregar os dados na inicialização
    fetchProfile();

    // Polling com um intervalo muito maior (2 minutos)
    const startPolling = () => {
      // Limpar qualquer timeout existente antes de criar um novo
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      
      pollingTimeoutRef.current = window.setTimeout(() => {
        if (!isEditing.current) {
          fetchProfile();
        }
        startPolling();
      }, 120000); // 2 minutos
    };

    startPolling();

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    isEditing.current = true;
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add special handler for phone input
  const handlePhoneChange = (value: string) => {
    isEditing.current = true;
    setFormData((prev: any) => ({
      ...prev,
      phone: value,
    }));
  };

  // Manipulador para atualização do logotipo
  const handleLogoUpdate = (url: string | null) => {
    isEditing.current = true;
    setFormData((prev: any) => ({
      ...prev,
      logo_url: url,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: formData.company_name,
          responsible_name: formData.responsible_name,
          phone: formData.phone,
          address: formData.address,
          business_description: formData.business_description,
          logo_url: formData.logo_url, // Salvar a URL do logotipo
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar informações',
          variant: 'destructive',
        });
        console.error('Erro ao atualizar perfil:', error);
      } else {
        toast({
          title: 'Sucesso',
          description: 'Informações atualizadas com sucesso',
        });
        
        // Após salvar, podemos buscar os dados atualizados
        isEditing.current = false;
        fetchProfile();
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    isEditing.current = true;
  };

  const handleBlur = () => {
    // Aguardar um pouco antes de considerar que parou de editar
    setTimeout(() => {
      isEditing.current = false;
    }, 300);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Informações do negócio</CardTitle>
        <p className="text-sm text-gray-500">Configure os dados do seu estabelecimento</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Componente de upload de logotipo */}
          <div>
            <LogoUpload 
              currentLogoUrl={formData.logo_url}
              onLogoUpdate={handleLogoUpdate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Nome da empresa</Label>
            <Input
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Nome da sua empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_name">Nome do responsável</Label>
            <Input
              id="responsible_name"
              name="responsible_name"
              value={formData.responsible_name}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Nome completo do responsável"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <PhoneInput
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Número de telefone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Endereço completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_description">Descrição do negócio</Label>
            <Textarea
              id="business_description"
              name="business_description"
              value={formData.business_description || ''}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Breve descrição dos serviços oferecidos"
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar alterações'}
            {loading ? <X className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
