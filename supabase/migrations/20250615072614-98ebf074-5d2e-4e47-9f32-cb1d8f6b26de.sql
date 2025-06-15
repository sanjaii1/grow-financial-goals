
-- Add full_name and updated_at columns to the profiles table
ALTER TABLE public.profiles
ADD COLUMN full_name TEXT,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
