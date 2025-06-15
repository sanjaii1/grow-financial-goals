
-- Create a table for savings goals
CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own savings goals
CREATE POLICY "Users can view their own savings goals"
  ON public.savings_goals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy that allows users to create their own savings goals
CREATE POLICY "Users can create their own savings goals"
  ON public.savings_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own savings goals
CREATE POLICY "Users can update their own savings goals"
  ON public.savings_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own savings goals
CREATE POLICY "Users can delete their own savings goals"
  ON public.savings_goals
  FOR DELETE
  USING (auth.uid() = user_id);
