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
      
      const debtData = {
        ...newDebt,
        user_id: user.id,
        interest_rate: newDebt.interest_rate || null,
      };

      const { error } = await supabase.from("debts").insert([debtData]);
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
        const { error } = await supabase.from("debts").update({ ...updatedDebt, interest_rate: updatedDebt.interest_rate || null }).eq("id", selectedDebt.id);
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">💳 Debts</h1>
        <Button asChild variant="outline"><Link to="/">Dashboard</Link></Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-8 w-full">Add New Debt</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Debt</DialogTitle></DialogHeader>
          <Form {...addDebtForm}>
            <form onSubmit={addDebtForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField control={addDebtForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Debt Name</FormLabel><FormControl><Input placeholder="e.g., Credit Card" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addDebtForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Total Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addDebtForm.control} name="interest_rate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 18.9" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addDebtForm.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={addDebt.isPending}>{addDebt.isPending ? "Adding..." : "Add Debt"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <h2 className="text-xl font-semibold mb-4">Your Debts</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : debts?.length === 0 ? (
        <div className="text-center text-muted-foreground">No debts found.</div>
      ) : (
        <div className="space-y-4">
          {debts?.map(debt => {
            const paidPercentage = debt.amount > 0 ? (debt.paid_amount / debt.amount) * 100 : 0;
            return (
              <Card key={debt.id} className="relative overflow-hidden">
                <CardContent className="pt-4 flex flex-col md:flex-row justify-between items-start">
                  <div className="flex-grow">
                    <span className="font-bold text-lg">{debt.name}</span>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(debt.due_date).toLocaleDateString()}
                      {" | "}Interest: {debt.interest_rate ?? 0}%
                    </div>
                    <div className="mt-2">
                      <span className="mr-2 font-semibold">Total:</span>
                      <span>₹{debt.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="mr-2 font-semibold">Paid:</span>
                      <span>₹{debt.paid_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-8 w-full max-w-xs">
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${Math.min(100, paidPercentage)}%` }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-right">
                      {`${Math.round(Math.min(100, paidPercentage))}% paid`}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 md:pt-0 md:pl-4 self-center md:self-auto">
                    <Button variant="ghost" size="icon" onClick={() => handlePaymentClick(debt)}>
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(debt)}>
                      <Edit className="h-5 w-5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-5 w-5 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this debt.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDebt.mutate(debt.id)}>Delete</AlertDialogAction>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Debt</DialogTitle></DialogHeader>
          <Form {...editDebtForm}>
            <form onSubmit={editDebtForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField control={editDebtForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Debt Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Total Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="interest_rate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={updateDebt.isPending}>{updateDebt.isPending ? "Saving..." : "Save Changes"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Payment to "{selectedDebt?.name}"</DialogTitle></DialogHeader>
           <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
              <FormField control={paymentForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={addPayment.isPending}>{addPayment.isPending ? "Adding..." : "Add"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;
