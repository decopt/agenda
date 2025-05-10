
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    responsibleName: "",
    companyName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // For signup, first create the auth user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              responsible_name: formData.responsibleName,
              company_name: formData.companyName,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Wait a moment to ensure the trigger has time to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if we got a user back
        if (authData.user) {
          toast.success("Conta criada com sucesso!", {
            description: "Bem-vindo ao AgendaFácil."
          });
          navigate("/dashboard");
        } else {
          // This can happen if email confirmation is enabled
          uiToast({
            title: "Verifique seu email",
            description: "Um link de confirmação foi enviado para seu email.",
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;

        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = error.message;
      
      // More user-friendly error messages
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos";
      } else if (error.message.includes("User already registered")) {
        errorMessage = "Este email já está registrado";
      } else if (error.message.includes("Database error")) {
        errorMessage = "Erro ao criar conta. Por favor tente novamente.";
      }
      
      uiToast({
        title: "Erro!",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? "Criar Conta" : "Entrar"}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Cadastre sua empresa no AgendaFácil"
              : "Acesse sua conta do AgendaFácil"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="responsibleName" className="block text-sm font-medium text-gray-700">
                    Nome do Responsável
                  </label>
                  <Input
                    id="responsibleName"
                    value={formData.responsibleName}
                    onChange={(e) =>
                      setFormData({ ...formData, responsibleName: e.target.value })
                    }
                    required={isSignUp}
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Nome da Empresa
                  </label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    required={isSignUp}
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isSignUp
                ? "Já tem uma conta? Entre aqui"
                : "Não tem uma conta? Cadastre-se"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
