
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

interface IncomeExpenseChartProps {
  incomes: Income[];
  expenses: Expense[];
}

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function IncomeExpenseChart({ incomes, expenses }: IncomeExpenseChartProps) {
  const chartData: ChartData[] = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    incomes.forEach(income => {
      const month = format(parseISO(income.income_date), "MMM yyyy");
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      monthlyData[month].income += income.amount;
    });

    expenses.forEach(expense => {
      const month = format(parseISO(expense.expense_date), "MMM yyyy");
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      monthlyData[month].expense += expense.amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      // Correctly sort by parsing the 'MMM yyyy' string
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    return sortedMonths.map(month => ({
      month,
      income: monthlyData[month].income,
      expense: monthlyData[month].expense,
    })).slice(-6); // Show last 6 months
  }, [incomes, expenses]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income vs. Expense</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
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
        <CardTitle>Income vs. Expense</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Bar dataKey="income" fill="var(--color-income)" radius={4} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
