import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavigationLink {
  href: string;
  label: string;
}

interface NavbarProps {
  navigationLinks?: NavigationLink[];
}

const Navbar = ({ navigationLinks = [] }: NavbarProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState<string>('free');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        // Get user's plan
        const { data } = await supabase
          .from('company_config')
          .select('plan_type')
          .eq('user_id', session.user.id)
          .single();
          
        if (data) {
          setPlanType(data.plan_type);
        }
      }
      
      setLoading(false);
    };
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center h-16">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/favicon.ico" alt="AgendaFácil Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-agendafacil-700">AgendaFácil</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {navigationLinks.length > 0 && (
            <div className="hidden md:flex space-x-6 mr-4">
              {navigationLinks.map((link, index) => (
                <a 
                  key={index} 
                  href={link.href}
                  className="text-gray-600 hover:text-agendafacil-700 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-agendafacil-100 text-agendafacil-700 text-sm">
                      {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">
                    {user.email ? user.email.split('@')[0] : "Usuário"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                <DropdownMenuItem className="flex items-center gap-2">
                  {planType === 'pro' ? (
                    <>
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span>Plano PRO</span>
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 text-gray-400" />
                      <span>Plano Gratuito</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard?tab=configuracoes" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
