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
import { Trash2, Edit, PlusCircle, MoreHorizontal } from "lucide-react";
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
import { Link } from "react-router-dom";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
      setIsDeleteDialogOpen(false);
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

  const handleDeleteClick = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedDebt) {
        deleteDebt.mutate(selectedDebt.id);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <span role="img" aria-label="credit card">💳</span> Debts
              </CardTitle>
              <CardDescription className="mt-1">
                Manage your debts and plan your repayments.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Debt</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Debt</DialogTitle>
                  <DialogDescription>
                    Enter the details of your debt below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addDebtForm}>
                  <form onSubmit={addDebtForm.handleSubmit(onAddSubmit)} className="space-y-4">
                    <FormField control={addDebtForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Debt Name</FormLabel><FormControl><Input placeholder="e.g., Credit Card" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={addDebtForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Total Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={addDebtForm.control} name="interest_rate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 18.9" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={addDebtForm.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={addDebt.isPending} className="w-full">{addDebt.isPending ? "Adding..." : "Add Debt"}</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Paid Amount</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Interest</TableHead>
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
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : debts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No debts found. Start by adding one.
                    </TableCell>
                  </TableRow>
                ) : (
                  debts?.map(debt => {
                    const paidPercentage = debt.amount > 0 && debt.paid_amount ? (debt.paid_amount / debt.amount) * 100 : 0;
                    const remainingAmount = debt.amount - (debt.paid_amount || 0);
                    return (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">{debt.name}</TableCell>
                        <TableCell className="text-right">₹{debt.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-400">₹{(debt.paid_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-red-400">₹{remainingAmount.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(debt.due_date).toLocaleDateString()}</TableCell>
                        <TableCell className="hidden md:table-cell text-right">{debt.interest_rate ?? 0}%</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center justify-start gap-2">
                            <Progress value={paidPercentage} className="h-2 w-[100px]" />
                            <span className="text-xs text-muted-foreground">{`${Math.round(paidPercentage)}%`}</span>
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
                                <DropdownMenuItem onClick={() => handlePaymentClick(debt)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Add Payment</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditClick(debt)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(debt)}>
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

      {/* Edit Debt Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Edit Debt</DialogTitle>
                <DialogDescription>
                    Update the details of your debt below.
                </DialogDescription>
            </DialogHeader>
          <Form {...editDebtForm}>
            <form onSubmit={editDebtForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField control={editDebtForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Debt Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Total Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="interest_rate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editDebtForm.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={updateDebt.isPending} className="w-full">{updateDebt.isPending ? "Saving..." : "Save Changes"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add Payment to "{selectedDebt?.name}"</DialogTitle>
                <DialogDescription>
                    Enter the amount you want to pay.
                </DialogDescription>
            </DialogHeader>
           <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
              <FormField control={paymentForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={addPayment.isPending} className="w-full">{addPayment.isPending ? "Adding..." : "Add"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Debt Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete this debt.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteDebt.isPending}>
                {deleteDebt.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Debts;
