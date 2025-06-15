
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Trash2, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Link } from "react-router-dom";

const savingsGoalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  target_amount: z.coerce.number().positive("Target amount must be positive"),
  target_date: z.string().optional(),
});

const addContributionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

type SavingsGoal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  user_id: string;
};

const fetchSavingsGoals = async () => {
  const { data, error } = await supabase.from("savings_goals").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data;
};

const Savings = () => {
  const queryClient = useQueryClient();
  const [isAddContributionDialogOpen, setIsAddContributionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  const { data: savingsGoals, isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["savings_goals"],
    queryFn: fetchSavingsGoals,
  });

  const addSavingsGoal = useMutation({
    mutationFn: async (newGoal: z.infer<typeof savingsGoalSchema>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");
      
      const goalData = {
        ...newGoal,
        user_id: user.id,
        target_date: newGoal.target_date || null,
      };
      const { error } = await supabase.from("savings_goals").insert([goalData]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      toast({ title: "Success", description: "Savings goal added!" });
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSavingsGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      toast({ title: "Success", description: "Savings goal deleted." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addContribution = useMutation({
    mutationFn: async ({ goal, amount }: { goal: SavingsGoal; amount: number }) => {
      const newCurrentAmount = goal.current_amount + amount;
      const { error } = await supabase
        .from("savings_goals")
        .update({ current_amount: newCurrentAmount })
        .eq("id", goal.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      toast({ title: "Success", description: "Contribution added!" });
      setIsAddContributionDialogOpen(false);
      addContributionForm.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<z.infer<typeof savingsGoalSchema>>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: { name: "", target_amount: 0, target_date: "" },
  });

  const addContributionForm = useForm<z.infer<typeof addContributionSchema>>({
    resolver: zodResolver(addContributionSchema),
    defaultValues: { amount: 0 },
  });

  const onAddGoalSubmit = (values: z.infer<typeof savingsGoalSchema>) => {
    addSavingsGoal.mutate(values);
  };
  
  const onAddContributionSubmit = (values: z.infer<typeof addContributionSchema>) => {
    if (selectedGoal) {
      addContribution.mutate({ goal: selectedGoal, amount: values.amount });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <Button asChild variant="outline">
          <Link to="/">Dashboard</Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Add New Savings Goal</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddGoalSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Goal Name</FormLabel><FormControl><Input placeholder="e.g., New Car" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="target_amount" render={({ field }) => (<FormItem><FormLabel>Target Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 20000" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="target_date" render={({ field }) => (<FormItem><FormLabel>Target Date (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={addSavingsGoal.isPending}>{addSavingsGoal.isPending ? "Adding..." : "Add Goal"}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Your Goals</h2>
        {isLoading ? (<p>Loading goals...</p>) : savingsGoals && savingsGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savingsGoals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <Card key={goal.id}>
                  <CardHeader><CardTitle className="flex justify-between items-center">{goal.name}<Button variant="ghost" size="icon" onClick={() => deleteSavingsGoal.mutate(goal.id)}><Trash2 className="h-4 w-4" /></Button></CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}</p>
                    <Progress value={progress} className="mb-4" />
                    {goal.target_date && (<p className="text-sm text-muted-foreground">Target Date: {new Date(goal.target_date).toLocaleDateString()}</p>)}
                    <Dialog open={isAddContributionDialogOpen && selectedGoal?.id === goal.id} onOpenChange={(open) => { if (!open) { setIsAddContributionDialogOpen(false); setSelectedGoal(null); } }}>
                      <DialogTrigger asChild><Button variant="outline" className="w-full mt-4" onClick={() => { setSelectedGoal(goal); setIsAddContributionDialogOpen(true); }}}><PlusCircle className="mr-2 h-4 w-4" /> Add Contribution</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Contribution to "{goal.name}"</DialogTitle></DialogHeader>
                        <Form {...addContributionForm}>
                          <form onSubmit={addContributionForm.handleSubmit(onAddContributionSubmit)} className="space-y-4">
                            <FormField control={addContributionForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="submit" disabled={addContribution.isPending}>{addContribution.isPending ? "Adding..." : "Add"}</Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (<p>You have no savings goals yet. Add one to get started!</p>)}
      </div>
    </div>
  );
};

export default Savings;
