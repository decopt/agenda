
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  highlightedDates?: Date[];
  className?: string;
}

const Calendar = ({ 
  onDateSelect, 
  highlightedDates = [],
  className = ""
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    if (onDateSelect) onDateSelect(day);
  };

  const isHighlighted = (date: Date) => {
    return highlightedDates.some(highlightedDate => 
      isSameDay(highlightedDate, date)
    );
  };

  return (
    <div className={cn("bg-white rounded-lg shadow p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handlePrevMonth}
          className="text-gray-600 hover:text-agendafacil-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-medium text-gray-900">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleNextMonth}
          className="text-gray-600 hover:text-agendafacil-600"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-10 rounded-md"></div>
        ))}
        
        {daysInMonth.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isDayHighlighted = isHighlighted(day);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-10 rounded-md flex items-center justify-center text-sm transition-colors",
                isDayHighlighted && !isSelected && "bg-agendafacil-100 text-agendafacil-700",
                isSelected && "bg-agendafacil-600 text-white",
                !isSelected && !isDayHighlighted && "hover:bg-agendafacil-50"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
        
        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
          <div key={`empty-end-${index}`} className="h-10 rounded-md"></div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
