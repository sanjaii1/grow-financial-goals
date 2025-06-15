
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Legend, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"

type ChartData = {
  month: string;
  income: number;
  expense: number;
}

type Income = {
  amount: number;
  income_date: string;
}

type Expense = {
  amount: number;
  expense_date: string;
}

interface CashFlowChartProps {
  incomes: Income[];
  expenses: Expense[];
}

const chartConfig = {
  income: {
    label: "Income",
    theme: {
      light: "hsl(145 63% 49%)",
      dark: "hsl(145 58% 59%)",
    },
  },
  expense: {
    label: "Expense",
    theme: {
      light: "hsl(0 84% 60%)",
      dark: "hsl(0 91% 71%)",
    },
  },
} satisfies ChartConfig

const processDailyData = (incomes: Income[], expenses: Expense[], days: number): ChartData[] => {
    const dailyData: { [key: string]: { income: number; expense: number } } = {};
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayKey = format(date, "yyyy-MM-dd");
        dailyData[dayKey] = { income: 0, expense: 0 };
    }
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    incomes.forEach(income => {
        if (!income.income_date) return;
        const incomeDate = parseISO(income.income_date);
        if (incomeDate >= startDate && incomeDate <= today) {
            const dayKey = format(incomeDate, "yyyy-MM-dd");
            if (dailyData.hasOwnProperty(dayKey)) {
                dailyData[dayKey].income += income.amount;
            }
        }
    });

    expenses.forEach(expense => {
        if (!expense.expense_date) return;
        const expenseDate = parseISO(expense.expense_date);
        if (expenseDate >= startDate && expenseDate <= today) {
            const dayKey = format(expenseDate, "yyyy-MM-dd");
            if (dailyData.hasOwnProperty(dayKey)) {
                dailyData[dayKey].expense += expense.amount;
            }
        }
    });

    return Object.keys(dailyData).map(dayKey => ({
        month: format(parseISO(dayKey), "MMM d"),
        income: dailyData[dayKey].income,
        expense: dailyData[dayKey].expense,
    }));
}

export function CashFlowChart({ incomes, expenses }: CashFlowChartProps) {
  const [view, setView] = useState<'yearly' | 'monthly' | 'daily'>('yearly');
  const isMobile = useIsMobile();

  const chartData: ChartData[] = useMemo(() => {
    if (view === 'yearly') {
        const monthlyData: { [key: string]: { income: number; expense: number } } = {};
        const today = new Date();

        // Initialize the last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = format(date, "MMM yyyy");
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }

        incomes.forEach(income => {
          if (!income.income_date) return;
          const monthKey = format(parseISO(income.income_date), "MMM yyyy");
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey].income += income.amount;
          }
        });

        expenses.forEach(expense => {
          if (!expense.expense_date) return;
          const monthKey = format(parseISO(expense.expense_date), "MMM yyyy");
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey].expense += expense.amount;
          }
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
          return new Date(a).getTime() - new Date(b).getTime();
        });
        
        const data = sortedMonths.map(monthKey => ({
          month: monthKey.slice(0, 3),
          income: monthlyData[monthKey].income,
          expense: monthlyData[monthKey].expense,
        }));

        return data;

    } else if (view === 'monthly') {
        return processDailyData(incomes, expenses, 30);
    } else { // daily
        return processDailyData(incomes, expenses, 7);
    }
  }, [incomes, expenses, view]);

  const chartDescription = {
    yearly: "Last 12 months",
    monthly: "Last 30 days",
    daily: "Last 7 days",
  };

  const ChartHeader = () => (
    <CardHeader>
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-start'}`}>
        <div>
          <CardTitle>Cash Flow</CardTitle>
          <CardDescription>{chartDescription[view]}</CardDescription>
        </div>
        <Tabs defaultValue={view} onValueChange={(v) => setView(v as 'yearly' | 'monthly' | 'daily')}>
          <TabsList className={isMobile ? "grid w-full grid-cols-3" : ""}>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </CardHeader>
  );
  
  const noData = chartData.length === 0 || chartData.every(d => d.income === 0 && d.expense === 0);

  if (noData) {
    return (
      <Card>
        <ChartHeader />
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Not enough data to display chart for this period.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ChartHeader />
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart 
            accessibilityLayer 
            data={chartData} 
            margin={isMobile ? { top: 10, right: 10, left: -10, bottom: 0 } : { top: 20, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={view === 'monthly' ? (isMobile ? 6 : 4) : view === 'daily' ? (isMobile ? 1 : 0) : 'preserveStartEnd'}
              fontSize={isMobile ? 10 : 12}
            />
            <YAxis
              tickFormatter={(value) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(Number(value))}`}
              axisLine={false}
              tickLine={false}
              width={isMobile ? 45 : 60}
              fontSize={isMobile ? 10 : 12}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                  formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  indicator="dot"
              />}
            />
            <Legend wrapperStyle={isMobile ? { paddingTop: '20px' } : {}} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
