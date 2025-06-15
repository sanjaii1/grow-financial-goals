
-- Create a table for budgets
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT budgets_user_id_category_key UNIQUE (user_id, category)
);

-- Add Row Level Security (RLS) to ensure users can only manage their own budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own budget records
CREATE POLICY "Users can view their own budgets"
  ON public.budgets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT new budget records
CREATE POLICY "Users can create their own budgets"
  ON public.budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own budget records
CREATE POLICY "Users can update their own budgets"
  ON public.budgets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own budget records
CREATE POLICY "Users can delete their own budgets"
  ON public.budgets
  FOR DELETE
  USING (auth.uid() = user_id);
