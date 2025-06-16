
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, User, Clock, Edit, Trash2, PlusCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { Debt } from "@/types/debt";

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  onAddPayment: (debt: Debt) => void;
  onViewDetails: (debt: Debt) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-blue-100 text-blue-800";
    case "cleared":
      return "bg-green-100 text-green-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeColor = (type: string) => {
  return type === "borrowed" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700";
};

export function DebtCard({ debt, onEdit, onDelete, onAddPayment, onViewDetails }: DebtCardProps) {
  const remainingAmount = debt.amount - (debt.paid_amount || 0);
  const progressPercentage = debt.amount > 0 ? ((debt.paid_amount || 0) / debt.amount) * 100 : 0;
  const isOverdue = new Date(debt.due_date) < new Date() && debt.status === "active";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{debt.name}</h3>
              <div className="flex gap-2 mt-1">
                <Badge className={getStatusColor(isOverdue ? "overdue" : debt.status)}>
                  {isOverdue ? "Overdue" : debt.status}
                </Badge>
                <Badge variant="outline" className={getTypeColor(debt.debt_type)}>
                  {debt.debt_type === "borrowed" ? "You Owe" : "They Owe"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              ₹{remainingAmount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              of ₹{debt.amount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due: {format(new Date(debt.due_date), "MMM dd, yyyy")}</span>
          </div>
          
          {debt.interest_rate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Interest: {debt.interest_rate}% p.a.</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onAddPayment(debt)}
            className="flex-1"
            disabled={debt.status === "cleared"}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
          <Button variant="outline" size="sm" onClick={() => onViewDetails(debt)}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(debt)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(debt)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
