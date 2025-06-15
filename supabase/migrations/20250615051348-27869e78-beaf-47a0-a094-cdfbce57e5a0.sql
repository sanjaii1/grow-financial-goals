
-- Create a table for incomes
CREATE TABLE public.incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  income_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only manage their own income
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own income records
CREATE POLICY "Users can view their own income"
  ON public.incomes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT new income records
CREATE POLICY "Users can create their own income"
  ON public.incomes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own income records
CREATE POLICY "Users can update their own income"
  ON public.incomes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own income records
CREATE POLICY "Users can delete their own income"
  ON public.incomes
  FOR DELETE
  USING (auth.uid() = user_id);
