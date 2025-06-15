
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
import { Trash2, PlusCircle, MoreHorizontal, PiggyBank, Search, Filter, CalendarIcon } from "lucide-react";
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
import { useState, useMemo } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { data: savingsGoals, isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["savings_goals"],
    queryFn: fetchSavingsGoals,
  });

  const filteredSavingsGoals = useMemo(() => {
    return savingsGoals?.filter((goal) => {
      const nameMatch = goal.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let dateMatch = true;
      if (filters.startDate || filters.endDate) {
        if (!goal.target_date) {
          dateMatch = false;
        } else {
          const targetDate = new Date(goal.target_date);
          targetDate.setMinutes(targetDate.getMinutes() + targetDate.getTimezoneOffset());
          const startDateMatch = filters.startDate ? targetDate >= filters.startDate : true;
          const endDateMatch = filters.endDate ? targetDate <= filters.endDate : true;
          dateMatch = startDateMatch && endDateMatch;
        }
      }
      return nameMatch && dateMatch;
    });
  }, [savingsGoals, searchTerm, filters]);

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

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
    setIsFiltersOpen(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <PiggyBank /> Savings Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your savings goals and track your progress.
          </p>
        </div>
        <Dialog open={isAddGoalDialogOpen} onOpenChange={setIsAddGoalDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Goal</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Savings Goal</DialogTitle>
              <DialogDescription>
                Enter the details of your savings goal below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddGoalSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Goal Name</FormLabel><FormControl><Input placeholder="e.g., New Car" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="target_amount" render={({ field }) => (<FormItem><FormLabel>Target Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 20000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="target_date" render={({ field }) => (<FormItem><FormLabel>Target Date (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={addSavingsGoal.isPending} className="w-full">{addSavingsGoal.isPending ? "Adding..." : "Add Goal"}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0 pt-6 sm:p-6">
          <div className="flex flex-col gap-4 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search goals by name..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full sm:w-auto">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>{isFiltersOpen ? "Hide" : "Show"} Filters</span>
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full">
              <CollapsibleContent>
                <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                  <div className="grid gap-2">
                    <Label htmlFor="start-date">Target Date From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date"
                          variant={"outline"}
                          className={cn(
                            "w-full md:w-[240px] justify-start text-left font-normal",
                            !filters.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.startDate ? format(filters.startDate, "PPP") : <span>Pick a start date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.startDate}
                          onSelect={(date) => handleFilterChange({ startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end-date">Target Date To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="end-date"
                          variant={"outline"}
                          className={cn(
                            "w-full md:w-[240px] justify-start text-left font-normal",
                            !filters.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.endDate ? format(filters.endDate, "PPP") : <span>Pick an end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.endDate}
                          onSelect={(date) => handleFilterChange({ endDate: date })}
                          disabled={(date) =>
                            filters.startDate ? date < filters.startDate : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={clearFilters} variant="ghost">Clear Filters</Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Target Amount</TableHead>
                  <TableHead className="text-right">Saved Amount</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="hidden md:table-cell">Target Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Progress</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSavingsGoals?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No savings goals found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSavingsGoals?.map(goal => {
                    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                    const remainingAmount = goal.target_amount - goal.current_amount;
                    return (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">{goal.name}</TableCell>
                        <TableCell className="text-right">₹{goal.target_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-400">₹{goal.current_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-red-400">₹{remainingAmount.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center justify-start gap-2">
                            <Progress value={progress} className="h-2 w-[100px]" />
                            <span className="text-xs text-muted-foreground">{`${Math.round(progress)}%`}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleAddContributionClick(goal)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Add Contribution</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(goal)}>
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
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add Contribution to "{selectedGoal?.name}"</DialogTitle>
                <DialogDescription>
                    Enter the amount for your contribution.
                </DialogDescription>
            </DialogHeader>
           <Form {...addContributionForm}>
            <form onSubmit={addContributionForm.handleSubmit(onAddContributionSubmit)} className="space-y-4">
              <FormField control={addContributionForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={addContribution.isPending} className="w-full">{addContribution.isPending ? "Adding..." : "Add"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Goal Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete this savings goal.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
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
