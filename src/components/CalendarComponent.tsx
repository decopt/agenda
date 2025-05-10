
import { useState } from "react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";

interface CalendarComponentProps {
  highlightedDates?: Date[];
}

const CalendarComponent = ({ highlightedDates = [] }: CalendarComponentProps) => {
  const [date, setDate] = useState<Date>(new Date());
  
  return (
    <div className="border rounded-md p-4 bg-white">
      <CalendarUI
        mode="single"
        selected={date}
        onSelect={(newDate) => newDate && setDate(newDate)}
        locale={ptBR}
        className="mx-auto pointer-events-auto"
        modifiers={{
          highlighted: highlightedDates
        }}
        modifiersClassNames={{
          highlighted: "bg-agendafacil-100 text-agendafacil-700 font-bold rounded-full"
        }}
      />
    </div>
  );
};

export default CalendarComponent;
