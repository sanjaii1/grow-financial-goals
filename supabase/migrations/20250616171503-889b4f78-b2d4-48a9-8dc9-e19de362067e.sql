
-- Add missing columns to the debts table
ALTER TABLE public.debts 
ADD COLUMN debt_type text NOT NULL DEFAULT 'borrowed',
ADD COLUMN status text NOT NULL DEFAULT 'active',
ADD COLUMN notes text,
ADD COLUMN payment_mode text,
ADD COLUMN start_date date;

-- Add check constraints for valid values
ALTER TABLE public.debts 
ADD CONSTRAINT debt_type_check CHECK (debt_type IN ('borrowed', 'lent'));

ALTER TABLE public.debts 
ADD CONSTRAINT status_check CHECK (status IN ('active', 'cleared', 'overdue'));
