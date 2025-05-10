
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <div className="hero-gradient text-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6 md:space-y-8 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Simplifique seus agendamentos online
            </h1>
            <p className="text-lg md:text-xl text-purple-100">
              Uma plataforma completa para que seus clientes agendem serviços de forma autônoma,
              simples e rápida. Ideal para salões, clínicas, consultorias e muito mais.
            </p>
            <div>
              <Button asChild size="lg" className="bg-[#E9B949] hover:bg-[#D6A93B] text-gray-800 font-medium rounded-full px-8">
                <Link to="/auth">
                  CLIQUE E COMECE AGORA
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/11927929-ffd9-4b77-b58f-39f258175c76.png" 
              alt="Automatize seus agendamentos e ganhe tempo"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
