import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { PlusCircle, Target, Edit, Trash2, MoreHorizontal } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import BudgetDialog from "@/components/budgets/BudgetDialog";
import DeleteBudgetAlert from "@/components/budgets/DeleteBudgetAlert";
import { ColoredProgress } from "@/components/ColoredProgress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_COLORS } from "@/lib/constants";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type Expense = Database["public"]["Tables"]["expenses"]["Row"];

const fetchBudgets = async (userId: string): Promise<Budget[]> => {
  const { data, error } = await supabase.from("budgets").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchExpenses = async (userId: string): Promise<Expense[]> => {
  const { data, error } = await supabase.from("expenses").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data || [];
};

const Budgets = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

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

    const { data: budgets, isLoading: isLoadingBudgets } = useQuery({
        queryKey: ["budgets", user?.id],
        queryFn: () => fetchBudgets(user!.id),
        enabled: !!user,
    });
    
    const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
        queryKey: ["expenses", user?.id],
        queryFn: () => fetchExpenses(user!.id),
        enabled: !!user,
    });

    const expenseCategories = useMemo(() => {
        if (!expenses) return [];
        const categories = expenses.map(e => e.category);
        return [...new Set(categories)];
    }, [expenses]);
    
    const budgetsWithSpending = useMemo(() => {
        if (!budgets || !expenses) return [];
        return budgets.map(budget => {
            const spent = expenses
                .filter(expense => expense.category === budget.category)
                .reduce((sum, expense) => sum + expense.amount, 0);
            const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            return { ...budget, spent, progress };
        }).sort((a,b) => a.category.localeCompare(b.category));
    }, [budgets, expenses]);

    const handleAddBudget = () => {
        setSelectedBudget(null);
        setIsBudgetDialogOpen(true);
    };

    const handleEditBudget = (budget: Budget) => {
        setSelectedBudget(budget);
        setIsBudgetDialogOpen(true);
    };

    const handleDeleteBudget = (budgetId: string) => {
        setBudgetToDelete(budgetId);
        setIsDeleteDialogOpen(true);
    };

    const isLoading = isLoadingBudgets || isLoadingExpenses;
    
    const CATEGORY_COLORS = [ "#3b82f6", "#ec4899", "#f59e0b", "#22c55e", "#8b5cf6", "#6366f1", "#ef4444", "#f97316" ];

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Target className="h-8 w-8" /> Budget Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Set and track your monthly budgets for different expense categories.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddBudget}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Budget
                    </Button>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                    ) : budgetsWithSpending.length > 0 ? (
                        <div className="space-y-4">
                            {budgetsWithSpending.map((budget, index) => (
                                <Card key={budget.id} className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1 mb-4 sm:mb-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-semibold">{budget.category}</p>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <ColoredProgress value={budget.progress} indicatorColor={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} className="w-full" />
                                                <span className="text-sm font-medium whitespace-nowrap">{Math.min(100, budget.progress).toFixed(0)}%</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                ₹{budget.spent.toLocaleString()} spent of ₹{budget.amount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 self-end sm:self-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteBudget(budget.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                            <div className="text-center">
                                <p className="text-muted-foreground">No budgets set yet.</p>
                                <Button variant="link" onClick={handleAddBudget}>Create your first budget</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <BudgetDialog 
                open={isBudgetDialogOpen}
                setOpen={setIsBudgetDialogOpen}
                budget={selectedBudget}
                expenseCategories={expenseCategories}
                existingBudgetCategories={budgets?.map(b => b.category) || []}
            />

            <DeleteBudgetAlert 
                open={isDeleteDialogOpen}
                setOpen={setIsDeleteDialogOpen}
                budgetId={budgetToDelete}
                onSuccess={() => setBudgetToDelete(null)}
            />
        </div>
    );
}

export default Budgets;
