
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
import { PlusCircle, Edit, Trash2, MoreHorizontal } from "lucide-react";
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
    return searchMatch && categoryMatch;
  });

  const expenseCategories = ["All", ...new Set(expenses?.map(e => e.category).filter(Boolean) as string[])];

  return (
    <>
      <div className="w-full">
        <Card className="bg-slate-900 border-slate-800 text-gray-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <span role="img" aria-label="money with wings">💸</span> Expenses
                </CardTitle>
                <CardDescription className="text-gray-400">Manage your expenses and track your spending.</CardDescription>
              </div>
              <Button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Input 
                    placeholder="Search by description or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm bg-slate-800 border-slate-700 placeholder:text-gray-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {expenseCategories.map(cat => (
                  <Button 
                    key={cat} 
                    variant="outline"
                    onClick={() => setCategoryFilter(cat)}
                    className={`shrink-0 ${
                      categoryFilter === cat 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                      : 'border-slate-700 hover:bg-slate-800 text-gray-300'
                    }`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-slate-700 hover:bg-slate-900">
                    <TableHead className="text-gray-400">Description</TableHead>
                    <TableHead className="text-right text-gray-400">Amount</TableHead>
                    <TableHead className="hidden md:table-cell text-gray-400">Category</TableHead>
                    <TableHead className="hidden md:table-cell text-right text-gray-400">Date</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-slate-800">
                        <TableCell><Skeleton className="h-4 w-32 bg-slate-700" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 ml-auto bg-slate-700" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20 bg-slate-700" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24 ml-auto bg-slate-700" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-full bg-slate-700" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredExpenses && filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="text-right text-red-500 font-semibold">-₹{expense.amount.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{expense.category}</TableCell>
                        <TableCell className="hidden md:table-cell text-right">{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleEditClick(expense)} className="focus:bg-slate-800 focus:text-gray-200">
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-slate-800" onClick={() => handleDeleteClick(expense)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-slate-800">
                      <TableCell colSpan={5} className="h-24 text-center text-gray-400">
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
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-gray-300">
          <DialogHeader>
            <DialogTitle>{selectedExpense ? 'Edit' : 'Add New'} Expense</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the details of your expense below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <Input
              placeholder="Description (e.g. Groceries)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 placeholder:text-gray-500"
            />
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 placeholder:text-gray-500"
            />
            <Input
              placeholder="Category (e.g. Food)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 placeholder:text-gray-500"
            />
            <Input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
              className="bg-slate-800 border-slate-700"
            />
            <Button type="submit" disabled={addOrUpdateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {addOrUpdateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-gray-300">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete your expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 hover:bg-slate-800 text-gray-300">Cancel</AlertDialogCancel>
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
