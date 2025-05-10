
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Upload } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  position: z.string().optional(),
  email: z.string().email("Email inválido").or(z.literal("")),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StaffFormProps {
  staff?: {
    id: string;
    name: string;
    position?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  } | null;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

const StaffForm = ({ staff, isOpen, onClose }: StaffFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(staff?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: staff?.name || "",
      position: staff?.position || "",
      email: staff?.email || "",
      phone: staff?.phone || "",
      bio: staff?.bio || "",
    },
  });
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };
  
  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };
  
  const uploadAvatar = async (userId: string, staffId: string): Promise<string | null> => {
    if (!avatarFile) {
      return avatarUrl; // Return existing URL if no new file
    }
    
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `staff-avatars/${userId}/${staffId}.${fileExt}`;
      
      // Check if the storage bucket exists, if not create it
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'avatars')) {
        await supabase.storage.createBucket('avatars', { public: true });
      }
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload da imagem");
      return null;
    }
  };
  
  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }
      
      const userId = session.user.id;
      
      // If editing existing staff
      if (staff?.id) {
        // Upload avatar if changed
        let avatarUrlToSave = avatarUrl;
        if (avatarFile) {
          avatarUrlToSave = await uploadAvatar(userId, staff.id);
        }
        
        const { error } = await supabase
          .from("staff")
          .update({
            name: values.name,
            position: values.position || null,
            email: values.email || null,
            phone: values.phone || null,
            bio: values.bio || null,
            avatar_url: avatarUrlToSave,
            updated_at: new Date().toISOString(),
          })
          .eq("id", staff.id)
          .eq("user_id", userId);
        
        if (error) throw error;
        
        toast.success("Colaborador atualizado com sucesso");
        onClose(true);
      } 
      // Creating new staff
      else {
        const { data: newStaff, error } = await supabase
          .from("staff")
          .insert({
            user_id: userId,
            name: values.name,
            position: values.position || null,
            email: values.email || null,
            phone: values.phone || null,
            bio: values.bio || null,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Upload avatar if provided
        if (avatarFile && newStaff) {
          const avatarUrlToSave = await uploadAvatar(userId, newStaff.id);
          
          if (avatarUrlToSave) {
            // Update the staff with the avatar URL
            await supabase
              .from("staff")
              .update({ avatar_url: avatarUrlToSave })
              .eq("id", newStaff.id);
          }
        }
        
        toast.success("Colaborador cadastrado com sucesso");
        onClose(true);
      }
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error("Erro ao salvar colaborador");
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {staff ? "Editar Colaborador" : "Novo Colaborador"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <Avatar className="h-24 w-24 mb-2">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="Avatar preview" />
                  ) : (
                    <AvatarFallback>
                      {form.watch("name") ? getInitials(form.watch("name")) : "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                {avatarUrl && (
                  <Button 
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Avatar
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do colaborador" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo/função</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Cargo ou função" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Email" />
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
                      <Input {...field} placeholder="Telefone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografia</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Breve biografia ou descrição" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onClose()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StaffForm;
