import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
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
import { PlusCircle, Edit, Trash2, Filter, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  
  const filteredExpenses = expenses?.filter(expense => 
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryInitial = (category: string) => category?.[0]?.toUpperCase() || 'E';
  
  const categoryColors: { [key: string]: string } = {
      'Food': 'bg-yellow-200 text-yellow-800',
      'Dining': 'bg-yellow-200 text-yellow-800',
      'Utilities': 'bg-purple-200 text-purple-800',
      'Transportation': 'bg-green-200 text-green-800',
      'Other': 'bg-gray-200 text-gray-800',
  };

  const getCategoryColor = (category: string) => {
      for (const key in categoryColors) {
          if (category.toLowerCase().includes(key.toLowerCase())) {
              return categoryColors[key];
          }
      }
      return categoryColors['Other'];
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <div className="flex items-center gap-4">
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Dashboard</Link>
          </Button>
        </div>
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

      <Card>
        <CardHeader>
           <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                  />
              </div>
              <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Show Filters
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredExpenses && filteredExpenses.length > 0 ? (
            <div className="space-y-1">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback className={`${getCategoryColor(expense.category)} font-semibold`}>
                      {getCategoryInitial(expense.category)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="font-semibold">{expense.description}</p>
                    <p className="text-sm text-gray-500">
                      {expense.category} &bull; {new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-red-600">-₹{expense.amount.toLocaleString()}</p>
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(expense)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(expense)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">No expenses found</h3>
              <p className="text-gray-500">Try adding a new expense to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Expenses;
