
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BookingHeaderProps {
  userId: string;
  companyName?: string | null;
}

const BookingHeader: React.FC<BookingHeaderProps> = ({ userId, companyName }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLogo = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('logo_url')
          .eq('id', userId)
          .single();
          
        if (!error && data && data.logo_url) {
          setLogoUrl(data.logo_url);
        }
      } catch (error) {
        console.error('Erro ao buscar logotipo:', error);
      }
    };
    
    fetchLogo();
  }, [userId]);
  
  return (
    <div className="p-6 flex flex-col items-center justify-center text-center">
      <Avatar className="h-20 w-20 mb-4">
        {logoUrl ? (
          <AvatarImage src={logoUrl} alt={companyName || 'Logo da empresa'} />
        ) : (
          <AvatarFallback className="bg-gray-100">
            <Building2 className="h-10 w-10 text-gray-400" />
          </AvatarFallback>
        )}
      </Avatar>
      
      <h1 className="text-2xl font-bold mb-2">
        {companyName || 'Agendamento Online'}
      </h1>
      <p className="text-gray-500 max-w-md">
        Selecione um serviço para agendar
      </p>
    </div>
  );
};

export default BookingHeader;
