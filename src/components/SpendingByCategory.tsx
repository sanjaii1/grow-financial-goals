
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

type Expense = {
  category: string;
  amount: number;
};

interface SpendingByCategoryProps {
  expenses: Expense[];
}

const COLORS = ["#8884d8", "#82ca9d", "#FFBB28", "#FF8042", "#0088FE", "#00C49F"];

export function SpendingByCategory({ expenses }: SpendingByCategoryProps) {
  const isMobile = useIsMobile();
  const categoryData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const categoryMap = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);
  
  const totalExpenses = useMemo(() => categoryData.reduce((acc, curr) => acc + curr.value, 0), [categoryData]);

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Your spending distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No spending data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Total Spending: ₹{totalExpenses.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value: number, name: string) => [`₹${value.toLocaleString()}`, name]}
            />
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={isMobile ? 80 : 100}
              innerRadius={isMobile ? 40 : 60}
              fill="#8884d8"
              paddingAngle={2}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend 
              iconSize={10} 
              layout={isMobile ? 'horizontal' : 'vertical'} 
              verticalAlign={isMobile ? 'bottom' : 'middle'} 
              align={isMobile ? 'center' : 'right'}
              wrapperStyle={isMobile ? { paddingTop: '20px', fontSize: '12px' } : {}}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
