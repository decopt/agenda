
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekdayAvailability } from "./availability/WeekdayAvailability";
import { AvailabilityLoading } from "./availability/AvailabilityLoading";
import { weekdays } from "@/utils/constants";
import { 
  AvailableHour,
  fetchAvailableHours,
  saveAvailableHours
} from "@/services/availabilityService";

const AvailabilitySettings = () => {
  const [availableHours, setAvailableHours] = useState<AvailableHour[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableHours();
  }, []);

  const loadAvailableHours = async () => {
    try {
      setLoading(true);
      const data = await fetchAvailableHours();
      
      if (data.length > 0) {
        setAvailableHours(data);
      } else {
        // Set default values for all weekdays
        const defaults = weekdays.map(({ day }) => ({
          weekday: day,
          start_time: "09:00",
          end_time: "18:00",
          lunch_break_start: "12:00",
          lunch_break_end: "13:00",
          has_lunch_break: false
        }));
        setAvailableHours(defaults);
      }
    } catch (error) {
      console.error("Error fetching available hours:", error);
      toast({
        title: "Erro ao carregar horários",
        description: "Não foi possível carregar seus horários disponíveis.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTime = (index: number, field: string, value: string) => {
    const newHours = [...availableHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setAvailableHours(newHours);
  };

  const handleToggleLunchBreak = (index: number, checked: boolean) => {
    const newHours = [...availableHours];
    newHours[index] = { 
      ...newHours[index], 
      has_lunch_break: checked
    };
    
    if (!checked) {
      // If lunch break is disabled, clear the times
      newHours[index].lunch_break_start = null;
      newHours[index].lunch_break_end = null;
    } else if (!newHours[index].lunch_break_start) {
      // Set default lunch break times if not already set
      newHours[index].lunch_break_start = "12:00";
      newHours[index].lunch_break_end = "13:00";
    }
    
    setAvailableHours(newHours);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const success = await saveAvailableHours(availableHours);
      
      if (success) {
        toast({
          title: "Horários salvos",
          description: "Seus horários disponíveis foram atualizados com sucesso."
        });
      }
    } catch (error) {
      console.error("Error saving available hours:", error);
      toast({
        title: "Erro ao salvar horários",
        description: "Não foi possível salvar seus horários disponíveis.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AvailabilityLoading />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Horários Disponíveis</CardTitle>
        <CardDescription>
          Configure os horários em que você está disponível para agendamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {availableHours.map((hour, index) => (
            <WeekdayAvailability
              key={hour.weekday}
              day={weekdays.find(day => day.day === hour.weekday)!}
              hourData={hour}
              index={index}
              onTimeChange={handleChangeTime}
              onToggleLunchBreak={handleToggleLunchBreak}
            />
          ))}

          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full mt-4"
          >
            {saving ? "Salvando..." : "Salvar Horários"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilitySettings;
