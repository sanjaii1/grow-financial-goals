
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

interface DebtSummaryData {
  totalBorrowed: number;
  totalLent: number;
  totalOwed: number;
  totalOwing: number;
  activeDebts: number;
  overdueDebts: number;
  clearedDebts: number;
}

interface DebtSummaryProps {
  data: DebtSummaryData;
}

export function DebtSummary({ data }: DebtSummaryProps) {
  const netBalance = data.totalLent - data.totalBorrowed;
  const isPositive = netBalance >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Owe</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">₹{data.totalOwed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total borrowed amount remaining
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">They Owe</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">₹{data.totalOwing.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total lent amount remaining
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          <DollarSign className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}₹{netBalance.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {isPositive ? 'You are owed more' : 'You owe more'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {data.activeDebts} Active
            </Badge>
            <Badge variant="outline" className="text-xs text-red-600">
              {data.overdueDebts} Overdue
            </Badge>
            <Badge variant="outline" className="text-xs text-green-600">
              {data.clearedDebts} Cleared
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total debts tracked
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
