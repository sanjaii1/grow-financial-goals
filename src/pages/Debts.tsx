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
import { Trash2, Edit, PlusCircle } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const debtSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  interest_rate: z.coerce.number().min(0).optional().nullable(),
  due_date: z.string().min(1, "Due date is required"),
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
});

type Debt = {
  id: string;
  name: string;
  amount: number;
  interest_rate: number | null;
  due_date: string;
  paid_amount: number;
  created_at: string;
  user_id: string;
};

const fetchDebts = async () => {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const Debts = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const { data: debts, isLoading } = useQuery<Debt[]>({
    queryKey: ["debts"],
    queryFn: fetchDebts,
  });

  const addDebtForm = useForm<z.infer<typeof debtSchema>>({
    resolver: zodResolver(debtSchema),
    defaultValues: { name: "", amount: 0, interest_rate: 0, due_date: "" },
  });

  const editDebtForm = useForm<z.infer<typeof debtSchema>>({
    resolver: zodResolver(debtSchema),
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0 },
  });

  const addDebt = useMutation({
    mutationFn: async (newDebt: z.infer<typeof debtSchema>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");
      
      const { error } = await supabase.from("debts").insert([
        {
          name: newDebt.name,
          amount: newDebt.amount,
          due_date: newDebt.due_date,
          user_id: user.id,
          interest_rate: newDebt.interest_rate || null,
        },
      ]);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Success", description: "Debt added!" });
      addDebtForm.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateDebt = useMutation({
    mutationFn: async (updatedDebt: z.infer<typeof debtSchema>) => {
        if (!selectedDebt) throw new Error("No debt selected");
        const { error } = await supabase.from("debts").update({ 
          name: updatedDebt.name,
          amount: updatedDebt.amount,
          due_date: updatedDebt.due_date,
          interest_rate: updatedDebt.interest_rate || null
        }).eq("id", selectedDebt.id);
        if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Success", description: "Debt updated!" });
      setIsEditDialogOpen(false);
      setSelectedDebt(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Success", description: "Debt deleted." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addPayment = useMutation({
    mutationFn: async ({ debt, amount }: { debt: Debt; amount: number }) => {
      const newPaidAmount = (debt.paid_amount || 0) + amount;
      const { error } = await supabase
        .from("debts")
        .update({ paid_amount: newPaidAmount })
        .eq("id", debt.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Success", description: "Payment added!" });
      setIsPaymentDialogOpen(false);
      paymentForm.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onAddSubmit = (values: z.infer<typeof debtSchema>) => addDebt.mutate(values);
  const onEditSubmit = (values: z.infer<typeof debtSchema>) => updateDebt.mutate(values);
  const onPaymentSubmit = (values: z.infer<typeof paymentSchema>) => {
    if (selectedDebt) {
      addPayment.mutate({ debt: selectedDebt, amount: values.amount });
    }
  };
  
  const handleEditClick = (debt: Debt) => {
    setSelectedDebt(debt);
    editDebtForm.reset({
        name: debt.name,
        amount: debt.amount,
        interest_rate: debt.interest_rate,
        due_date: debt.due_date,
    });
    setIsEditDialogOpen(true);
  };

  const handlePaymentClick = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsPaymentDialogOpen(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 text-gray-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
            <span role="img" aria-label="credit card">💳</span> Debts
        </h1>
        <Button asChild variant="outline" className="border-slate-700 hover:bg-slate-800 text-gray-300"><Link to="/">Dashboard</Link></Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-8 w-full bg-blue-600 hover:bg-blue-700 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Add New Debt</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-gray-300">
          <DialogHeader>
            <DialogTitle>Add New Debt</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the details of your debt below.
            </DialogDescription>
          </DialogHeader>
          <Form {...addDebtForm}>
            <form onSubmit={addDebtForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField control={addDebtForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Debt Name</FormLabel><FormControl><Input placeholder="e.g., Credit Card" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addDebtForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Total Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addDebtForm.control} name="interest_rate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 18.9" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addDebtForm.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} className="bg-slate-800 border-slate-700" /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={addDebt.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{addDebt.isPending ? "Adding..." : "Add Debt"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <h2 className="text-xl font-semibold mb-4 text-gray-200">Your Debts</h2>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800 p-4">
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div className="flex-grow">
                  <Skeleton className="h-6 w-40 mb-2 bg-slate-700" />
                  <Skeleton className="h-4 w-64 bg-slate-700" />
                  <div className="mt-2 space-y-1">
                    <Skeleton className="h-4 w-32 bg-slate-700" />
                    <Skeleton className="h-4 w-28 bg-slate-700" />
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-8 w-full max-w-xs">
                  <Skeleton className="h-3 w-full rounded-full bg-slate-700" />
                  <Skeleton className="h-3 w-1/4 mt-1 ml-auto bg-slate-700" />
                </div>
                <div className="flex gap-2 pt-2 md:pt-0 md:pl-4 self-center md:self-auto">
                  <Skeleton className="h-10 w-10 rounded-md bg-slate-700" />
                  <Skeleton className="h-10 w-10 rounded-md bg-slate-700" />
                  <Skeleton className="h-10 w-10 rounded-md bg-slate-700" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : debts?.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-center text-gray-400">
                No debts found. Start by adding one.
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {debts?.map(debt => {
            const paidPercentage = debt.amount > 0 && debt.paid_amount ? (debt.paid_amount / debt.amount) * 100 : 0;
            return (
              <Card key={debt.id} className="bg-slate-900 border-slate-800 text-gray-300 overflow-hidden">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start">
                  <div className="flex-grow">
                    <span className="font-bold text-lg text-gray-100">{debt.name}</span>
                    <div className="text-sm text-gray-400">
                      Due: {new Date(debt.due_date).toLocaleDateString()}
                      {" | "}Interest: {debt.interest_rate ?? 0}%
                    </div>
                    <div className="mt-2">
                      <span className="mr-2 font-semibold text-gray-400">Total:</span>
                      <span className="text-gray-200">₹{debt.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="mr-2 font-semibold text-gray-400">Paid:</span>
                      <span className="text-green-400">₹{(debt.paid_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-8 w-full max-w-xs self-center">
                    <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${Math.min(100, paidPercentage)}%` }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-right text-gray-400">
                      {`${Math.round(Math.min(100, paidPercentage))}% paid`}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 md:pt-0 md:pl-4 self-center md:self-auto">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-slate-800" onClick={() => handlePaymentClick(debt)}>
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-slate-800" onClick={() => handleEditClick(debt)}>
                      <Edit className="h-5 w-5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-slate-800"><Trash2 className="h-5 w-5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-slate-700 text-gray-300">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">This action cannot be undone. This will permanently delete this debt.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-slate-700 hover:bg-slate-800 text-gray-300">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDebt.mutate(debt.id)} disabled={deleteDebt.isPending}>
                            {deleteDebt.isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Debt Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-gray-300">
            <DialogHeader>
                <DialogTitle>Edit Debt</DialogTitle>
                <DialogDescription className="text-gray-400">
                    Update the details of your debt below.
                </DialogDescription>
            </DialogHeader>
          <Form {...editDebtForm}>
            <form onSubmit={editDebtForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField control={editDebtForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Debt Name</FormLabel><FormControl><Input {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Total Amount</FormLabel><FormControl><Input type="number" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="interest_rate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} className="bg-slate-800 border-slate-700" /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={updateDebt.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{updateDebt.isPending ? "Saving..." : "Save Changes"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-gray-300">
            <DialogHeader>
                <DialogTitle>Add Payment to "{selectedDebt?.name}"</DialogTitle>
                <DialogDescription className="text-gray-400">
                    Enter the amount you want to pay.
                </DialogDescription>
            </DialogHeader>
           <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
              <FormField control={paymentForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} className="bg-slate-800 border-slate-700 placeholder:text-gray-500" /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={addPayment.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{addPayment.isPending ? "Adding..." : "Add"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;
