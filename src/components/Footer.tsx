
import { Link } from "react-router-dom";

interface FooterProps {
  email?: string;
}

const Footer = ({ email = "contato@conectdigitalpro.com" }: FooterProps) => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto py-10 px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold text-agendafacil-700">AgendaFácil</h2>
            <p className="text-sm text-gray-500 mt-1">Agendamento online simplificado</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <div>
              <h3 className="font-medium mb-3">Contato</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href={`mailto:${email}`} 
                    className="text-sm text-gray-500 hover:text-agendafacil-600 transition-colors"
                  >
                    {email}
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/auth" 
                    className="text-sm text-gray-500 hover:text-agendafacil-600 transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/auth?mode=signup" 
                    className="text-sm text-gray-500 hover:text-agendafacil-600 transition-colors"
                  >
                    Criar conta
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} AgendaFácil. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
