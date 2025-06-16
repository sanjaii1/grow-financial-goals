
export type DebtType = "borrowed" | "lent";
export type DebtStatus = "active" | "cleared" | "overdue";

export interface Debt {
  id: string;
  name: string;
  amount: number;
  paid_amount: number;
  interest_rate: number | null;
  due_date: string;
  start_date: string | null;
  debt_type: string; // Changed from DebtType to string to match database
  status: string; // Changed from DebtStatus to string to match database
  notes: string | null;
  payment_mode: string | null;
  created_at: string;
  updated_at: string | null;
  user_id: string;
}
