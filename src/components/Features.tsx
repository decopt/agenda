
import { Calendar, Clock, Link, Settings, Smartphone, Users } from "lucide-react";

const features = [
  {
    icon: <Link className="h-6 w-6 text-agendafacil-600" />,
    title: "Link Personalizado",
    description: "Compartilhe seu link único e deixe seus clientes agendarem quando quiserem."
  },
  {
    icon: <Calendar className="h-6 w-6 text-agendafacil-600" />,
    title: "Gestão de Calendário",
    description: "Controle seus horários, bloqueios e disponibilidade de forma simplificada."
  },
  {
    icon: <Users className="h-6 w-6 text-agendafacil-600" />,
    title: "Múltiplos Profissionais",
    description: "Adicione toda sua equipe e permita que os clientes escolham o profissional."
  },
  {
    icon: <Smartphone className="h-6 w-6 text-agendafacil-600" />,
    title: "100% Responsivo",
    description: "Interface adaptada para qualquer dispositivo, do desktop ao celular."
  },
  {
    icon: <Clock className="h-6 w-6 text-agendafacil-600" />,
    title: "Agendamento 24/7",
    description: "Seus clientes podem agendar a qualquer momento, mesmo fora do horário comercial."
  },
  {
    icon: <Settings className="h-6 w-6 text-agendafacil-600" />,
    title: "Painel Completo",
    description: "Dashboard intuitivo para gerenciar todos os aspectos do seu negócio."
  }
];

const Features = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos poderosos para seu negócio</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tudo o que você precisa para gerenciar agendamentos online de forma profissional e eficiente.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-card bg-white rounded-xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="bg-agendafacil-50 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
