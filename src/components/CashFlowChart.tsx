
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
import { useMemo } from "react"
import { format, parseISO } from "date-fns"

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

export function CashFlowChart({ incomes, expenses }: CashFlowChartProps) {
  const chartData: ChartData[] = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    incomes.forEach(income => {
      if (!income.income_date) return;
      const month = format(parseISO(income.income_date), "MMM yyyy");
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      monthlyData[month].income += income.amount;
    });

    expenses.forEach(expense => {
      if (!expense.expense_date) return;
      const month = format(parseISO(expense.expense_date), "MMM yyyy");
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      monthlyData[month].expense += expense.amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    return sortedMonths.map(month => ({
      month: month.slice(0, 3),
      income: monthlyData[month].income,
      expense: monthlyData[month].expense,
    })).slice(-12);
  }, [incomes, expenses]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
          <CardDescription>Last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Not enough data to display chart.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(Number(value))}`}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                  formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  indicator="dot"
              />}
            />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
