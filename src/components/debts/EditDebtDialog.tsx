
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Debt {
  id: string;
  name: string;
  amount: number;
  interest_rate: number | null;
  due_date: string;
  debt_type: string;
  notes: string | null;
}

interface EditDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
  onSubmit: (data: Partial<Debt>) => void;
  isLoading: boolean;
}

export function EditDebtDialog({ open, onOpenChange, debt, onSubmit, isLoading }: EditDebtDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    interest_rate: "",
    due_date: "",
    debt_type: "borrowed",
    notes: "",
  });

  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name,
        amount: debt.amount.toString(),
        interest_rate: debt.interest_rate?.toString() || "",
        due_date: debt.due_date,
        debt_type: debt.debt_type,
        notes: debt.notes || "",
      });
    }
  }, [debt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      amount: parseFloat(formData.amount),
      interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
      due_date: formData.due_date,
      debt_type: formData.debt_type,
      notes: formData.notes || null,
    });
  };

  if (!debt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Debt</DialogTitle>
          <DialogDescription>
            Update the details for this debt record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="debt_type">Type</Label>
              <Select value={formData.debt_type} onValueChange={(value) => setFormData({ ...formData, debt_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrowed">Borrowed (You Owe)</SelectItem>
                  <SelectItem value="lent">Lent (They Owe)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="interest_rate">Interest Rate (% per annum)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.1"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Debt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
