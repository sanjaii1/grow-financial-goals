import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";
import { cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Target, CreditCard } from "lucide-react";

const fetchDashboardData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const [debts, incomes, expenses, savingsGoals] = await Promise.all([
    supabase.from('debts').select('amount,paid_amount'),
    supabase.from('incomes').select('amount,income_date'),
    supabase.from('expenses').select('amount,expense_date'),
    supabase.from('savings_goals').select('current_amount,target_amount'),
  ]);

  if (debts.error) throw new Error(debts.error.message);
  if (incomes.error) throw new Error(incomes.error.message);
  if (expenses.error) throw new Error(expenses.error.message);
  if (savingsGoals.error) throw new Error(savingsGoals.error.message);

  return { 
    debts: debts.data, 
    incomes: incomes.data, 
    expenses: expenses.data, 
    savingsGoals: savingsGoals.data 
  };
};

const DashboardOverview = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalIncome = data?.incomes.reduce((acc, income) => acc + income.amount, 0) || 0;
  const totalExpenses = data?.expenses.reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const balance = totalIncome - totalExpenses;
  const totalSaved = data?.savingsGoals.reduce((acc, goal) => acc + goal.current_amount, 0) || 0;
  const remainingDebt = data?.debts.reduce((acc, debt) => acc + (debt.amount - (debt.paid_amount || 0)), 0) || 0;

  const overviewData = [
    { title: "Total Income", value: totalIncome, currency: true, icon: ArrowUpCircle, iconClass: "text-green-500" },
    { title: "Total Expenses", value: totalExpenses, currency: true, icon: ArrowDownCircle, iconClass: "text-red-500" },
    { title: "Balance", value: balance, currency: true, icon: Wallet, iconClass: "text-blue-500" },
    { title: "Remaining Debt", value: remainingDebt, currency: true, icon: CreditCard, iconClass: "text-orange-500" },
    { title: "Total Saved", value: totalSaved, currency: true, icon: Target, iconClass: "text-purple-500" },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Financial Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {overviewData.map((item, index) => (
          <Card key={index} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <item.icon className={cn("h-5 w-5", item.iconClass)} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {item.currency ? `₹${item.value.toLocaleString()}` : item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};


const Index = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild variant="outline">
          <Link to="/auth">Profile</Link>
        </Button>
      </div>

      <DashboardOverview />
    </div>
  );
};

export default Index;
