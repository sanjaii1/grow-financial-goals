import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Target, CreditCard, Calendar as CalendarIcon } from "lucide-react";
import { SavingsPlan } from "@/components/SavingsPlan";
import { RecentTransactions } from "@/components/RecentTransactions";
import { DateRange } from "react-day-picker";
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { StatisticsChart } from "@/components/StatisticsChart";

const fetchDashboardData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const [debts, incomes, expenses, savingsGoals] = await Promise.all([
    supabase.from('debts').select('amount,paid_amount'),
    supabase.from('incomes').select('id,source,amount,income_date,category'),
    supabase.from('expenses').select('id,description,amount,category,expense_date'),
    supabase.from('savings_goals').select('name,current_amount,target_amount'),
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

const DashboardOverview = ({ date }: { date?: DateRange }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!date?.from) {
      return data;
    }

    const interval = { start: date.from, end: date.to || date.from };

    const filteredIncomes = data.incomes.filter(income => {
      return isWithinInterval(parseISO(income.income_date), interval);
    });

    const filteredExpenses = data.expenses.filter(expense => {
      return isWithinInterval(parseISO(expense.expense_date), interval);
    });

    return {
      ...data,
      incomes: filteredIncomes,
      expenses: filteredExpenses,
    };
  }, [data, date]);

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
        <div className="mt-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="grid gap-1 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
               <div>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-2 w-full" />
               </div>
               <div>
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-2 w-full" />
               </div>
               <div>
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-2 w-full" />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalIncome = filteredData?.incomes.reduce((acc, income) => acc + income.amount, 0) || 0;
  const totalExpenses = filteredData?.expenses.reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const balance = totalIncome - totalExpenses;
  const totalSaved = data?.savingsGoals.reduce((acc, goal) => acc + goal.current_amount, 0) || 0;

  const totalDebt = data?.debts.reduce((acc, debt) => acc + debt.amount, 0) || 0;
  const totalPaidDebt = data?.debts.reduce((acc, debt) => acc + (debt.paid_amount || 0), 0) || 0;
  const remainingDebt = totalDebt - totalPaidDebt;
  const debtProgress = totalDebt > 0 ? (totalPaidDebt / totalDebt) * 100 : 0;
  
  const balanceProgress = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  
  const overviewData = [
    { title: "Total Income", value: totalIncome, currency: true, icon: ArrowUpCircle, iconClass: "text-green-500" },
    { title: "Total Expenses", value: totalExpenses, currency: true, icon: ArrowDownCircle, iconClass: "text-red-500" },
    { title: "Balance", value: balance, currency: true, icon: Wallet, iconClass: "text-blue-500", progress: balanceProgress > 0 ? balanceProgress : 0, progressLabel: balance < 0 ? `Deficit of ₹${Math.abs(balance).toLocaleString()}` : `${Math.round(balanceProgress)}% of income saved`},
    { title: "Remaining Debt", value: remainingDebt, currency: true, icon: CreditCard, iconClass: "text-orange-500", progress: debtProgress, progressLabel: `₹${totalPaidDebt.toLocaleString()} paid of ₹${totalDebt.toLocaleString()}` },
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
              {item.progress !== undefined && (
                <div className="mt-2 space-y-1">
                  <Progress value={item.progress} className="h-2" />
                  {item.progressLabel && (
                    <p className="text-xs text-muted-foreground">{item.progressLabel}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <RecentTransactions incomes={filteredData?.incomes || []} expenses={filteredData?.expenses || []} />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SavingsPlan savingsGoals={data?.savingsGoals || []} />
        <StatisticsChart expenses={filteredData?.expenses || []} />
      </div>
    </div>
  );
};


const Index = () => {
  const [period, setPeriod] = useState("this_month");
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  const handlePeriodChange = (selectedPeriod: string) => {
    setPeriod(selectedPeriod);
    const today = new Date();
    if (selectedPeriod === "today") {
      setDate({ from: startOfToday(), to: endOfToday() });
    } else if (selectedPeriod === "this_week") {
      setDate({ from: startOfWeek(today), to: endOfWeek(today) });
    } else if (selectedPeriod === "this_month") {
      setDate({ from: startOfMonth(today), to: endOfMonth(today) });
    } else if (selectedPeriod === "this_year") {
      setDate({ from: startOfYear(today), to: endOfYear(today) });
    } else if (selectedPeriod === "all_time") {
      setDate(undefined);
    }
    setIsMenuOpen(false);
  };

  const periodLabels: { [key: string]: string } = {
    today: "Today",
    this_week: "This Week",
    this_month: "This Month",
    this_year: "This Year",
    all_time: "All Time",
    custom: "Custom Range"
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>
                  {period === "custom" && date?.from
                    ? date.to
                      ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                      : format(date.from, "LLL dd, y")
                    : periodLabels[period]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-[240px]"
              onPointerDownOutside={(e) => {
                if (popoverContentRef.current?.contains(e.target as Node)) {
                  e.preventDefault();
                }
              }}
              onFocusOutside={(e) => {
                if (popoverContentRef.current?.contains(e.target as Node)) {
                  e.preventDefault();
                }
              }}
            >
              <DropdownMenuItem onSelect={() => handlePeriodChange("today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePeriodChange("this_week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePeriodChange("this_month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePeriodChange("this_year")}>This Year</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePeriodChange("all_time")}>All Time</DropdownMenuItem>
              <DropdownMenuSeparator />
               <Popover>
                  <PopoverTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Custom Range</DropdownMenuItem>
                  </PopoverTrigger>
                  <PopoverContent ref={popoverContentRef} className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={(range) => {
                        setDate(range)
                        setPeriod("custom")
                        if (range?.from && range.to) {
                          setIsMenuOpen(false);
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DashboardOverview date={date} />
    </div>
  );
};

export default Index;
