import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDebt = data?.debts.reduce((acc, debt) => acc + debt.amount, 0) || 0;
  const totalPaid = data?.debts.reduce((acc, debt) => acc + (debt.paid_amount || 0), 0) || 0;
  const remainingDebt = totalDebt - totalPaid;
  const totalIncome = data?.incomes.reduce((acc, income) => acc + income.amount, 0) || 0;
  const totalExpenses = data?.expenses.reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const totalSaved = data?.savingsGoals.reduce((acc, goal) => acc + goal.current_amount, 0) || 0;

  const overviewData = [
    { title: "Remaining Debt", value: remainingDebt, currency: true },
    { title: "Total Income", value: totalIncome, currency: true },
    { title: "Total Expenses", value: totalExpenses, currency: true },
    { title: "Total Saved", value: totalSaved, currency: true },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Financial Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {overviewData.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {item.currency ? `₹${item.value.toLocaleString()}` : item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <IncomeExpenseChart incomes={data?.incomes || []} expenses={data?.expenses || []} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Debts</h2>
          <p className="text-muted-foreground mb-4">Manage your outstanding debts.</p>
          <Button asChild>
            <Link to="/debts">Go to Debts</Link>
          </Button>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Incomes</h2>
          <p className="text-muted-foreground mb-4">Track your sources of income.</p>
          <Button asChild>
            <Link to="/incomes">Go to Incomes</Link>
          </Button>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Expenses</h2>
          <p className="text-muted-foreground mb-4">Track and categorize your spending.</p>
          <Button asChild>
            <Link to="/expenses">Go to Expenses</Link>
          </Button>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Savings Goals</h2>
          <p className="text-muted-foreground mb-4">Set and track your savings goals.</p>
          <Button asChild>
            <Link to="/savings">Go to Savings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
