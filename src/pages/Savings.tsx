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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Trash2, PlusCircle, MoreHorizontal, PiggyBank } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [isAddContributionDialogOpen, setIsAddContributionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
        name: newGoal.name,
        target_amount: newGoal.target_amount,
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
      setIsAddGoalDialogOpen(false);
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
      setIsDeleteDialogOpen(false);
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

  const handleAddContributionClick = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsAddContributionDialogOpen(true);
  };

  const handleDeleteClick = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedGoal) {
        deleteSavingsGoal.mutate(selectedGoal.id);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 text-gray-300">
      <Card className="bg-slate-900 border-slate-800 text-gray-300">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <PiggyBank /> Savings Goals
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                Manage your savings goals and track your progress.
              </CardDescription>
            </div>
            <Dialog open={isAddGoalDialogOpen} onOpenChange={setIsAddGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Add Goal</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-gray-300">
                <DialogHeader>
                  <DialogTitle>Add New Savings Goal</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Enter the details of your savings goal below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddGoalSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Goal Name</FormLabel><FormControl><Input placeholder="e.g., New Car" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="target_amount" render={({ field }) => (<FormItem><FormLabel>Target Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 20000" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="target_date" render={({ field }) => (<FormItem><FormLabel>Target Date (Optional)</FormLabel><FormControl><Input type="date" {...field} className="bg-slate-800 border-slate-700" /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={addSavingsGoal.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{addSavingsGoal.isPending ? "Adding..." : "Add Goal"}</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="border-b-slate-700 hover:bg-slate-900">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-right text-gray-400">Target Amount</TableHead>
                  <TableHead className="text-right text-gray-400">Saved Amount</TableHead>
                  <TableHead className="text-right text-gray-400">Remaining</TableHead>
                  <TableHead className="hidden md:table-cell text-gray-400">Target Date</TableHead>
                  <TableHead className="hidden lg:table-cell text-gray-400">Progress</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      <TableCell><Skeleton className="h-4 w-32 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto bg-slate-700" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24 bg-slate-700" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28 ml-auto bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md bg-slate-700" /></TableCell>
                    </TableRow>
                  ))
                ) : savingsGoals?.length === 0 ? (
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                      No savings goals found. Start by adding one.
                    </TableCell>
                  </TableRow>
                ) : (
                  savingsGoals?.map(goal => {
                    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                    const remainingAmount = goal.target_amount - goal.current_amount;
                    return (
                      <TableRow key={goal.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="font-medium">{goal.name}</TableCell>
                        <TableCell className="text-right">₹{goal.target_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-400">₹{goal.current_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-red-400">₹{remainingAmount.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center justify-start gap-2">
                            <Progress value={progress} className="h-2 w-[100px] bg-slate-700" />
                            <span className="text-xs text-gray-400">{`${Math.round(progress)}%`}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-700 focus:bg-slate-700 data-[state=open]:bg-slate-700">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-gray-300">
                              <DropdownMenuLabel className="border-b border-slate-700">Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleAddContributionClick(goal)} className="focus:bg-slate-800 focus:text-gray-200">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Add Contribution</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-slate-800" onClick={() => handleDeleteClick(goal)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Contribution Dialog */}
      <Dialog open={isAddContributionDialogOpen} onOpenChange={setIsAddContributionDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-gray-300">
            <DialogHeader>
                <DialogTitle>Add Contribution to "{selectedGoal?.name}"</DialogTitle>
                <DialogDescription className="text-gray-400">
                    Enter the amount for your contribution.
                </DialogDescription>
            </DialogHeader>
           <Form {...addContributionForm}>
            <form onSubmit={addContributionForm.handleSubmit(onAddContributionSubmit)} className="space-y-4">
              <FormField control={addContributionForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={addContribution.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{addContribution.isPending ? "Adding..." : "Add"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Goal Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-gray-300">
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">This action cannot be undone. This will permanently delete this savings goal.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-700 hover:bg-slate-800 text-gray-300">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteSavingsGoal.isPending}>
                {deleteSavingsGoal.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Savings;
