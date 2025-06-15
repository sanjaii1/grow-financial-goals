
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Income = {
  id: string;
  source: string;
  amount: number;
  income_date: string;
  category: string | null;
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
};

interface RecentTransactionsProps {
  incomes: Income[];
  expenses: Expense[];
}

export function RecentTransactions({ incomes, expenses }: RecentTransactionsProps) {
  const transactions = useMemo(() => {
    const combined = [
      ...incomes.map(i => ({
        id: i.id,
        type: 'income' as const,
        description: i.source,
        category: i.category,
        amount: i.amount,
        date: i.income_date
      })),
      ...expenses.map(e => ({
        id: e.id,
        type: 'expense' as const,
        description: e.description,
        category: e.category,
        amount: e.amount,
        date: e.expense_date
      }))
    ];

    return combined
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 10);
  }, [incomes, expenses]);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>No recent transactions found.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            No transactions to display.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Showing your {transactions.length} most recent transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-4 py-3">
              <Avatar className="h-9 w-9">
                 <AvatarFallback className={cn(
                    "font-semibold",
                    transaction.type === 'income' ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                 )}>
                  {getInitials(transaction.category)}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1 flex-1">
                <p className="font-medium text-sm">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">
                  {transaction.category} • {format(parseISO(transaction.date), "MMM d, yyyy")}
                </p>
              </div>
              <p className={cn(
                "font-semibold text-sm",
                transaction.type === 'income' ? "text-green-600" : "text-red-500"
              )}>
                {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Button asChild className="w-full" variant="outline">
          <Link to="/reports">View All Transactions</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
