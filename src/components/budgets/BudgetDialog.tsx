
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required."),
  amount: z.coerce.number().min(0.01, "Amount must be positive."),
});

interface BudgetDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    budget: Budget | null;
    expenseCategories: string[];
    existingBudgetCategories: string[];
}

const upsertBudget = async (budgetData: {data: Omit<BudgetInsert, 'user_id'> | BudgetUpdate, budgetId?: string}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    if (budgetData.budgetId) {
        // Update
        const { error } = await supabase.from("budgets").update(budgetData.data).eq("id", budgetData.budgetId);
        if (error) throw error;
    } else {
        // Insert
        const { error } = await supabase.from("budgets").insert({ ...budgetData.data, user_id: user.id } as BudgetInsert);
        if (error) {
            if (error.code === '23505') { // unique constraint violation
                throw new Error("A budget for this category already exists.");
            }
            throw error;
        }
    }
};

const BudgetDialog: React.FC<BudgetDialogProps> = ({ open, setOpen, budget, expenseCategories, existingBudgetCategories }) => {
    const queryClient = useQueryClient();
    const form = useForm<z.infer<typeof budgetSchema>>({
        resolver: zodResolver(budgetSchema),
        defaultValues: {
            category: "",
            amount: 0,
        },
    });

    useEffect(() => {
        if (budget) {
            form.reset({
                category: budget.category,
                amount: budget.amount,
            });
        } else {
            form.reset({
                category: "",
                amount: 0,
            });
        }
    }, [budget, form, open]);

    const mutation = useMutation({
        mutationFn: upsertBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            toast.success(budget ? "Budget updated successfully!" : "Budget added successfully!");
            setOpen(false);
        },
        onError: (error) => {
            toast.error("Failed to save budget: " + error.message);
        },
    });

    const onSubmit = (values: z.infer<typeof budgetSchema>) => {
        mutation.mutate({data: values, budgetId: budget?.id});
    };
    
    const availableCategories = expenseCategories.filter(
        (cat) => !existingBudgetCategories.includes(cat) || (budget && budget.category === cat)
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{budget ? "Edit Budget" : "Add Budget"}</DialogTitle>
                    <DialogDescription>
                        {budget ? "Update the details for your budget." : "Set a new budget for an expense category."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!budget}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {budget && <SelectItem value={budget.category}>{budget.category}</SelectItem>}
                                            {availableCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                            {availableCategories.length === 0 && !budget && (
                                                <div className="p-4 text-sm text-muted-foreground text-center">No new expense categories to add budgets for.</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Budget Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g., 500" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Saving..." : "Save Budget"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default BudgetDialog;
