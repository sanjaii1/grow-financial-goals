
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColoredProgress } from "@/components/ColoredProgress";
import { ChartBar, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type Income = Database["public"]["Tables"]["incomes"]["Row"];

const fetchExpenses = async (userId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchIncomes = async (userId: string): Promise<Income[]> => {
    const { data, error } = await supabase
      .from("incomes")
      .select("*")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data || [];
};

const Reports = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate("/auth");
            }
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                navigate("/auth");
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
        queryKey: ["expenses", user?.id],
        queryFn: () => fetchExpenses(user!.id),
        enabled: !!user,
    });
    
    const { data: incomes, isLoading: isLoadingIncomes } = useQuery({
        queryKey: ["incomes", user?.id],
        queryFn: () => fetchIncomes(user!.id),
        enabled: !!user,
    });

    const spendingByCategory = useMemo(() => {
        if (!expenses) return { categories: [], total: 0 };
        const categoryMap = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as { [key: string]: number });

        const total = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0);

        const categories = Object.entries(categoryMap)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        return { categories, total };
    }, [expenses]);
    
    const incomeBySource = useMemo(() => {
        if (!incomes) return { sources: [], total: 0 };
        const sourceMap = incomes.reduce((acc, income) => {
            acc[income.source] = (acc[income.source] || 0) + income.amount;
            return acc;
        }, {} as { [key: string]: number });

        const total = Object.values(sourceMap).reduce((sum, amount) => sum + amount, 0);

        const sources = Object.entries(sourceMap)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        return { sources, total };
    }, [incomes]);

    const isLoading = isLoadingExpenses || isLoadingIncomes;
    
    const CATEGORY_COLORS = [ "#3b82f6", "#ec4899", "#f59e0b", "#22c55e", "#8b5cf6", "#6366f1", "#ef4444", "#f97316" ];

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ChartBar className="h-8 w-8" /> Reports & Analytics
                </h1>
                <p className="text-muted-foreground mt-1">
                    Analyze your financial data with insightful reports and charts.
                </p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Tabs defaultValue="spending">
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                            <TabsTrigger value="spending"><TrendingDown className="mr-2 h-4 w-4" />Spending Analysis</TabsTrigger>
                            <TabsTrigger value="income"><TrendingUp className="mr-2 h-4 w-4" />Income Analysis</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="spending" className="mt-6">
                            <h3 className="text-xl font-semibold mb-4">Top Spending Categories</h3>
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : spendingByCategory.categories.length > 0 ? (
                                <div className="space-y-4">
                                    {spendingByCategory.categories.map((category, index) => (
                                        <div key={category.name}>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">{category.name}</span>
                                                <span className="">
                                                    ₹{category.amount.toLocaleString()} ({category.percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <ColoredProgress 
                                                value={category.percentage} 
                                                indicatorColor={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No spending data available.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="income" className="mt-6">
                            <h3 className="text-xl font-semibold mb-4">Top Income Sources</h3>
                             {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : incomeBySource.sources.length > 0 ? (
                                <div className="space-y-4">
                                    {incomeBySource.sources.map((source, index) => (
                                        <div key={source.name}>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">{source.name}</span>
                                                <span className="">
                                                    ₹{source.amount.toLocaleString()} ({source.percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <ColoredProgress 
                                                value={source.percentage}
                                                indicatorColor={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                             />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No income data available.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

export default Reports;
