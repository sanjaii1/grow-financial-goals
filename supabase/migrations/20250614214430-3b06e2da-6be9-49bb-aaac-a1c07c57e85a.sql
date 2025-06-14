
-- Create a table to store debts for each user
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  interest_rate NUMERIC, -- percent per year, nullable
  due_date DATE NOT NULL,
  paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own debts
CREATE POLICY "Users can view their own debts"
  ON public.debts FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own debts
CREATE POLICY "Users can insert their own debt"
  ON public.debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own debts
CREATE POLICY "Users can update their own debt"
  ON public.debts FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own debts
CREATE POLICY "Users can delete their own debt"
  ON public.debts FOR DELETE
  USING (auth.uid() = user_id);
