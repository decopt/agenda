
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

interface WeekdayAvailabilityProps {
  day: {
    day: string;
    label: string;
  };
  hourData: AvailableHour;
  index: number;
  onTimeChange: (index: number, field: string, value: string) => void;
  onToggleLunchBreak: (index: number, checked: boolean) => void;
}

interface AvailableHour {
  id?: string;
  weekday: string;
  start_time: string;
  end_time: string;
  lunch_break_start?: string | null;
  lunch_break_end?: string | null;
  has_lunch_break?: boolean;
  user_id?: string;
}

export const WeekdayAvailability = ({
  day,
  hourData,
  index,
  onTimeChange,
  onToggleLunchBreak
}: WeekdayAvailabilityProps) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{day.label}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`start-time-${index}`}>Horário inicial</Label>
          <div className="relative">
            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              id={`start-time-${index}`}
              type="time"
              value={hourData.start_time}
              onChange={(e) => onTimeChange(index, "start_time", e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`end-time-${index}`}>Horário final</Label>
          <div className="relative">
            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              id={`end-time-${index}`}
              type="time"
              value={hourData.end_time}
              onChange={(e) => onTimeChange(index, "end_time", e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t">
        <div className="flex items-center space-x-2 mb-3">
          <Switch
            id={`lunch-break-${index}`}
            checked={hourData.has_lunch_break}
            onCheckedChange={(checked) => onToggleLunchBreak(index, checked)}
          />
          <Label htmlFor={`lunch-break-${index}`}>
            Pausa para almoço
          </Label>
        </div>

        {hourData.has_lunch_break && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor={`lunch-start-${index}`}>Início da pausa</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id={`lunch-start-${index}`}
                  type="time"
                  value={hourData.lunch_break_start || ""}
                  onChange={(e) => onTimeChange(index, "lunch_break_start", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`lunch-end-${index}`}>Fim da pausa</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id={`lunch-end-${index}`}
                  type="time"
                  value={hourData.lunch_break_end || ""}
                  onChange={(e) => onTimeChange(index, "lunch_break_end", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
