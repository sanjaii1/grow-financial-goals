
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Debt } from "@/types/debt";

interface DebtDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
}

export function DebtDetailsDialog({ open, onOpenChange, debt }: DebtDetailsDialogProps) {
  if (!debt) return null;

  const remainingAmount = debt.amount - (debt.paid_amount || 0);
  const progressPercentage = debt.amount > 0 ? ((debt.paid_amount || 0) / debt.amount) * 100 : 0;
  const isOverdue = new Date(debt.due_date) < new Date() && debt.status === "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{debt.name}</DialogTitle>
          <DialogDescription>
            Debt details and payment information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant={debt.debt_type === "borrowed" ? "destructive" : "default"}>
              {debt.debt_type === "borrowed" ? "You Owe" : "They Owe"}
            </Badge>
            <Badge variant={isOverdue ? "destructive" : debt.status === "cleared" ? "default" : "secondary"}>
              {isOverdue ? "Overdue" : debt.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-semibold">₹{debt.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-semibold text-primary">₹{remainingAmount.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Payment Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Due Date</p>
              <p>{format(new Date(debt.due_date), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{format(new Date(debt.created_at), "MMM dd, yyyy")}</p>
            </div>
          </div>

          {debt.interest_rate && (
            <div>
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <p>{debt.interest_rate}% per annum</p>
            </div>
          )}

          {debt.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm bg-muted p-3 rounded-md">{debt.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
