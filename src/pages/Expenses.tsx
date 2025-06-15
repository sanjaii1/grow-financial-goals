import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { PlusCircle, Edit, Trash2, MoreHorizontal, Filter, Calendar as CalendarIcon, Search } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


type Expense = Database["public"]["Tables"]["expenses"]["Row"];

const fetchExpenses = async (userId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("expense_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

const addExpense = async (newExpense: Omit<Expense, "id" | "created_at">) => {
  const { data, error } = await supabase.from("expenses").insert(newExpense).select();
  if (error) throw new Error(error.message);
  return data;
};

const updateExpense = async (updatedExpense: Omit<Expense, "created_at" | "user_id">) => {
  const { id, ...rest } = updatedExpense;
  const { data, error } = await supabase.from("expenses").update(rest).match({ id }).select();
  if (error) throw new Error(error.message);
  return data;
};

const deleteExpense = async (id: string) => {
  const { error } = await supabase.from("expenses").delete().match({ id });
  if (error) throw new Error(error.message);
};

const Expenses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [showFilters, setShowFilters] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
       if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses", user?.id],
    queryFn: () => fetchExpenses(user!.id),
    enabled: !!user,
  });

  const addOrUpdateMutation = useMutation({
    mutationFn: (expenseData: Omit<Expense, "id" | "created_at"> | Omit<Expense, "created_at" | "user_id">) => {
      if ('id' in expenseData) {
        return updateExpense(expenseData as Omit<Expense, "created_at" | "user_id">);
      }
      return addExpense(expenseData as Omit<Expense, "id" | "created_at">);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id] });
      toast({ title: `Expense ${selectedExpense ? 'updated' : 'added'} successfully!` });
      setIsDialogOpen(false);
      setSelectedExpense(null);
    },
    onError: (error: Error) => {
      toast({ title: `Error ${selectedExpense ? 'updating' : 'adding'} expense`, description: error.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id] });
      toast({ title: "Expense deleted successfully!" });
      setIsDeleteDialogOpen(false);
      setSelectedExpense(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting expense", description: error.message, variant: "destructive" });
    },
  });

  const handleAddClick = () => {
    setSelectedExpense(null);
    setDescription("");
    setAmount("");
    setCategory("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setExpenseDate(expense.expense_date);
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedExpense) {
      deleteMutation.mutate(selectedExpense.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "You must be logged in to add an expense.", variant: "destructive" });
      return;
    }
    
    const commonData = {
      description,
      amount: parseFloat(amount),
      category,
      expense_date: expenseDate,
    };
    
    if (selectedExpense) {
        addOrUpdateMutation.mutate({ ...commonData, id: selectedExpense.id });
    } else {
        addOrUpdateMutation.mutate({ ...commonData, user_id: user.id });
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  const filteredExpenses = expenses?.filter(expense => {
    const searchMatch = !searchTerm || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'All' || expense.category === categoryFilter;
    
    if (!expense.expense_date) return false;
    const expenseDateObj = new Date(expense.expense_date);
    
    const startDateMatch = !startDate || expenseDateObj >= startDate;
    const endDateMatch = !endDate || expenseDateObj <= endDate;
    
    return searchMatch && categoryMatch && startDateMatch && endDateMatch;
  });

  const expenseCategories = ["All", ...new Set(expenses?.map(e => e.category).filter(Boolean) as string[])];

  return (
    <>
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span role="img" aria-label="money with wings">💸</span> Expenses
            </h1>
            <p className="text-muted-foreground">Manage your expenses and track your spending.</p>
          </div>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </span>
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="mr-2 h-4 w-4" />
                  {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>
            
            {showFilters && (
              <Card className="mb-4 bg-muted/50">
                  <CardContent className="pt-6">
                      <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                              <label className="text-sm font-medium mb-1 block">Category</label>
                              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                  <SelectTrigger>
                                      <SelectValue placeholder="All Categories" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {expenseCategories.map(cat => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>

                          <div>
                              <label className="text-sm font-medium mb-1 block">Start Date</label>
                              <Popover>
                                  <PopoverTrigger asChild>
                                      <Button
                                          variant={"outline"}
                                          className={cn(
                                              "w-full justify-start text-left font-normal bg-background",
                                              !startDate && "text-muted-foreground"
                                          )}
                                      >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                      <Calendar
                                          mode="single"
                                          selected={startDate}
                                          onSelect={setStartDate}
                                          initialFocus
                                      />
                                  </PopoverContent>
                              </Popover>
                          </div>

                          <div>
                              <label className="text-sm font-medium mb-1 block">End Date</label>
                              <Popover>
                                  <PopoverTrigger asChild>
                                      <Button
                                          variant={"outline"}
                                          className={cn(
                                              "w-full justify-start text-left font-normal bg-background",
                                              !endDate && "text-muted-foreground"
                                          )}
                                      >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                      <Calendar
                                          mode="single"
                                          selected={endDate}
                                          onSelect={setEndDate}
                                          disabled={(date) =>
                                              startDate ? date < startDate : false
                                          }
                                          initialFocus
                                      />
                                  </PopoverContent>
                              </Popover>
                          </div>
                      </div>
                  </CardContent>
              </Card>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Date</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredExpenses && filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="text-right text-red-500 font-semibold">-₹{expense.amount.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{expense.category}</TableCell>
                        <TableCell className="hidden md:table-cell text-right">{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleEditClick(expense)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(expense)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No expenses found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          setSelectedExpense(null);
          setDescription("");
          setAmount("");
          setCategory("");
          setExpenseDate(new Date().toISOString().split("T")[0]);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedExpense ? 'Edit' : 'Add New'} Expense</DialogTitle>
            <DialogDescription>
              Enter the details of your expense below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <Input
              placeholder="Description (e.g. Groceries)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              placeholder="Category (e.g. Food)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <Input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
            <Button type="submit" disabled={addOrUpdateMutation.isPending}>
              {addOrUpdateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Expenses;
