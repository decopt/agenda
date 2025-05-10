
import { useState, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash2 } from "lucide-react";

interface ServiceProps {
  id?: string;
  name?: string;
  duration?: number;
  price?: number;
  description?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isEditable?: boolean;
  // For home page service examples
  title?: string;
  icon?: ReactNode;
}

const ServiceCard = ({
  id = "",
  name,
  duration,
  price,
  description,
  onEdit,
  onDelete,
  isEditable = false,
  // For home page service examples
  title,
  icon
}: ServiceProps) => {
  const [isHovering, setIsHovering] = useState(false);

  const formatPrice = (price?: number) => {
    if (price === undefined) return "";
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (minutes === undefined) return "";
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Determine if we're using the card for home page examples or service listings
  const isHomePageExample = title !== undefined && icon !== undefined;

  return (
    <Card 
      className={`w-full transition-all duration-300 ${isHovering && isEditable ? 'shadow-md' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title || name}</CardTitle>
            {!isHomePageExample && duration !== undefined && (
              <CardDescription className="flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                {formatDuration(duration)}
              </CardDescription>
            )}
          </div>
          {!isHomePageExample && price !== undefined && (
            <div className="text-xl font-bold text-agendafacil-600">
              {formatPrice(price)}
            </div>
          )}
          {isHomePageExample && icon && (
            <div className="mb-4">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{description}</p>
      </CardContent>
      {isEditable && (
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-500 hover:text-agendafacil-600 hover:border-agendafacil-600"
            onClick={() => onEdit && onEdit(id)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500"
            onClick={() => onDelete && onDelete(id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ServiceCard;
