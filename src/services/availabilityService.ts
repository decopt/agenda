
import { supabase } from "@/integrations/supabase/client";

export interface AvailableHour {
  id?: string;
  weekday: string;
  start_time: string;
  end_time: string;
  lunch_break_start?: string | null;
  lunch_break_end?: string | null;
  has_lunch_break?: boolean;
  user_id?: string;
}

export const fetchAvailableHours = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("available_hours")
    .select("*")
    .eq("user_id", session.user.id);

  if (error) throw error;

  if (data && data.length > 0) {
    // Transform data to include has_lunch_break boolean
    return data.map(hour => ({
      ...hour,
      has_lunch_break: !!(hour.lunch_break_start && hour.lunch_break_end)
    }));
  }
  
  return [];
};

export const saveAvailableHours = async (availableHours: AvailableHour[]) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  // First delete all existing records for this user
  const { error: deleteError } = await supabase
    .from("available_hours")
    .delete()
    .eq("user_id", session.user.id);

  if (deleteError) throw deleteError;

  // Prepare data for insert
  const hoursToInsert = availableHours.map(hour => {
    return {
      weekday: hour.weekday,
      start_time: hour.start_time,
      end_time: hour.end_time,
      user_id: session.user.id,
      lunch_break_start: hour.has_lunch_break ? hour.lunch_break_start : null,
      lunch_break_end: hour.has_lunch_break ? hour.lunch_break_end : null
    };
  });

  // Then insert all new records
  const { error: insertError } = await supabase
    .from("available_hours")
    .insert(hoursToInsert);

  if (insertError) throw insertError;
  
  return true;
};
