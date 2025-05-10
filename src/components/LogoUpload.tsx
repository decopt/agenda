
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";
import { Building2, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogoUploadProps {
  currentLogoUrl: string | null;
  onLogoUpdate: (url: string | null) => void;
}

const LogoUpload = ({ currentLogoUrl, onLogoUpdate }: LogoUploadProps) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const { toast: hookToast } = useToast();

  useEffect(() => {
    setLogoUrl(currentLogoUrl);
  }, [currentLogoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFileSelected(null);
      return;
    }
    
    const file = e.target.files[0];
    
    // Validar tipo de arquivo
    if (!file.type.match('image/(jpeg|jpg|png|gif|svg+xml)')) {
      hookToast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem (JPEG, PNG, GIF ou SVG).",
        variant: "destructive"
      });
      return;
    }
    
    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      hookToast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 2MB.",
        variant: "destructive"
      });
      return;
    }
    
    setFileSelected(file);
  };

  const uploadLogo = async () => {
    if (!fileSelected) return;
    
    try {
      setUploading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");
      
      // Obter extensão do arquivo
      const fileExt = fileSelected.name.split('.').pop();
      // Criar nome único para o arquivo
      const fileName = `${session.user.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload do arquivo para o bucket 'company_logos'
      const { error: uploadError, data } = await supabase.storage
        .from('company_logos')
        .upload(filePath, fileSelected, {
          upsert: true,
          contentType: fileSelected.type
        });
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('company_logos')
        .getPublicUrl(filePath);
      
      // Atualizar o logoUrl no estado e chamar o callback
      setLogoUrl(publicUrl);
      onLogoUpdate(publicUrl);
      
      // Mostrar mensagem de sucesso
      toast.success("Logotipo atualizado com sucesso!");
      setFileSelected(null);
      
    } catch (error) {
      console.error("Erro ao fazer upload do logotipo:", error);
      hookToast({
        title: "Erro ao fazer upload",
        description: "Não foi possível enviar o logotipo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    try {
      setUploading(true);
      
      if (!logoUrl) return;
      
      // Extrair o nome do arquivo da URL
      const filePathMatch = logoUrl.match(/company_logos\/(.+)(\?.*)?$/);
      if (!filePathMatch) throw new Error("Formato de URL inválido");
      
      const filePath = filePathMatch[1];
      
      // Remover arquivo do armazenamento
      const { error } = await supabase.storage
        .from('company_logos')
        .remove([filePath]);
      
      if (error) throw error;
      
      // Atualizar o estado e chamar o callback
      setLogoUrl(null);
      onLogoUpdate(null);
      
      toast.success("Logotipo removido com sucesso!");
      
    } catch (error) {
      console.error("Erro ao remover logotipo:", error);
      hookToast({
        title: "Erro ao remover",
        description: "Não foi possível remover o logotipo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {logoUrl ? (
            <AvatarImage src={logoUrl} alt="Logo da empresa" />
          ) : null}
          <AvatarFallback className="bg-gray-100 text-gray-400">
            <Building2 className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1.5">
          <Label htmlFor="logo-upload">Logotipo da empresa</Label>
          <p className="text-sm text-gray-500">
            Adicione o logotipo da sua empresa para ser exibido na página de agendamento
          </p>
        </div>
      </div>

      <div className="grid w-full max-w-sm items-center gap-2">
        <div className="flex items-center gap-2">
          <Input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="cursor-pointer"
          />
          <Button
            type="button"
            onClick={uploadLogo}
            disabled={uploading || !fileSelected}
            size="sm"
            className="px-2"
          >
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
        
        {logoUrl && (
          <Button
            type="button"
            onClick={removeLogo}
            variant="outline"
            size="sm"
            className="w-fit"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover logotipo
          </Button>
        )}
      </div>
    </div>
  );
};

export default LogoUpload;
