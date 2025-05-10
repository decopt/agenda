
-- Add lunch break columns to available_hours table
ALTER TABLE public.available_hours
ADD COLUMN lunch_break_start TEXT NULL,
ADD COLUMN lunch_break_end TEXT NULL;
