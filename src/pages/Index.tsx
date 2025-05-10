
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const navigationLinks = [
    { href: "mailto:contato@conectdigitalpro.com", label: "Contato" }
  ];
  
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar navigationLinks={navigationLinks} />
      
      {/* Hero Section with featured image */}
      <Hero />
      
      {/* Features Section */}
      <div className="py-16 md:py-24 bg-white">
        <Features />
      </div>
      
      {/* Services Examples */}
      <div className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Agendamentos sem complicação</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ofereça aos seus clientes uma experiência de agendamento moderna e profissional.
              Veja o que você pode fazer com o AgendaFácil:
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              title="Barbearia"
              description="Agendamento para serviços de corte de cabelo, barba e tratamentos."
              icon={<Calendar className="h-8 w-8 text-agendafacil-600" />}
            />
            <ServiceCard
              title="Salão de Beleza"
              description="Manicure, pedicure, coloração, tratamentos e muito mais."
              icon={<Clock className="h-8 w-8 text-agendafacil-600" />}
            />
            <ServiceCard
              title="Consultoria"
              description="Planejamento financeiro, assessoria jurídica e consultoria empresarial."
              icon={<LinkIcon className="h-8 w-8 text-agendafacil-600" />}
            />
          </div>
          
          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link to="/auth">
                Comece agora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Não precisa de cartão de crédito. Comece gratuitamente hoje mesmo.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
