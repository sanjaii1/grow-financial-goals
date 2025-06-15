
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type Expense = {
  category: string;
  amount: number;
};

interface StatisticsChartProps {
  expenses: Expense[];
}

const COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444'];

const CustomLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col items-center md:items-start gap-4 w-full justify-center md:pl-8">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <div>
            <p className="text-md font-bold">₹{entry.payload.value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{entry.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export function StatisticsChart({ expenses }: StatisticsChartProps) {
  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const categoryMap = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Statistics</CardTitle>
        <Button variant="link" asChild className="text-sm text-muted-foreground -mr-4">
          <Link to="/reports">View all &gt;</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center md:h-[220px]">
            <ResponsiveContainer width="100%" height={220} className="md:h-full">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <CustomLegend payload={chartData.map((entry, index) => ({
              value: entry.name,
              type: 'circle',
              id: entry.name,
              color: COLORS[index % COLORS.length],
              payload: { ...entry }
            }))}/>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground">
            No spending data for this period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
