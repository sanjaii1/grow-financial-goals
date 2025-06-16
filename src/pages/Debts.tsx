import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, BarChart3, FileText } from "lucide-react";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtFilters, DebtFilters as DebtFiltersType } from "@/components/debts/DebtFilters";
import { DebtSummary } from "@/components/debts/DebtSummary";
import { AddDebtDialog } from "@/components/debts/AddDebtDialog";
import { PaymentDialog } from "@/components/debts/PaymentDialog";
import { EditDebtDialog } from "@/components/debts/EditDebtDialog";
import { DeleteDebtDialog } from "@/components/debts/DeleteDebtDialog";
import { DebtDetailsDialog } from "@/components/debts/DebtDetailsDialog";
import { Debt } from "@/types/debt";
import * as z from "zod";

const debtSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  interest_rate: z.coerce.number().min(0).optional().nullable(),
  due_date: z.string().min(1, "Due date is required"),
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
});

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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [filters, setFilters] = useState<DebtFiltersType>({
    search: "",
    status: "all",
    type: "all",
  });

  const { data: debts, isLoading } = useQuery({
    queryKey: ["debts"],
    queryFn: fetchDebts,
  });

  const summaryData = useMemo(() => {
    if (!debts) return {
      totalBorrowed: 0,
      totalLent: 0,
      totalOwed: 0,
      totalOwing: 0,
      activeDebts: 0,
      overdueDebts: 0,
      clearedDebts: 0,
    };

    const now = new Date();
    return debts.reduce((acc, debt) => {
      const remaining = debt.amount - (debt.paid_amount || 0);
      const isOverdue = new Date(debt.due_date) < now && remaining > 0;
      
      if (debt.debt_type === "borrowed") {
        acc.totalBorrowed += debt.amount;
        acc.totalOwed += remaining;
      } else {
        acc.totalLent += debt.amount;
        acc.totalOwing += remaining;
      }

      if (remaining <= 0) {
        acc.clearedDebts++;
      } else if (isOverdue) {
        acc.overdueDebts++;
      } else {
        acc.activeDebts++;
      }

      return acc;
    }, {
      totalBorrowed: 0,
      totalLent: 0,
      totalOwed: 0,
      totalOwing: 0,
      activeDebts: 0,
      overdueDebts: 0,
      clearedDebts: 0,
    });
  }, [debts]);

  const filteredDebts = useMemo(() => {
    if (!debts) return [];

    return debts.filter((debt) => {
      const searchMatch = 
        debt.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (debt.notes?.toLowerCase().includes(filters.search.toLowerCase()) ?? false);

      const remaining = debt.amount - (debt.paid_amount || 0);
      const isOverdue = new Date(debt.due_date) < new Date() && remaining > 0;
      const status = remaining <= 0 ? "cleared" : isOverdue ? "overdue" : "active";
      const statusMatch = filters.status === "all" || filters.status === status;

      const typeMatch = filters.type === "all" || filters.type === debt.debt_type;

      const debtDueDate = new Date(debt.due_date);
      const startDateMatch = !filters.startDate || debtDueDate >= filters.startDate;
      const endDateMatch = !filters.endDate || debtDueDate <= filters.endDate;

      let tabMatch = true;
      if (selectedTab === "borrowed") {
        tabMatch = debt.debt_type === "borrowed";
      } else if (selectedTab === "lent") {
        tabMatch = debt.debt_type === "lent";
      } else if (selectedTab === "active") {
        tabMatch = remaining > 0 && !isOverdue;
      } else if (selectedTab === "overdue") {
        tabMatch = isOverdue;
      } else if (selectedTab === "cleared") {
        tabMatch = remaining <= 0;
      }

      return searchMatch && statusMatch && typeMatch && startDateMatch && endDateMatch && tabMatch;
    });
  }, [debts, filters, selectedTab]);

  const addDebt = useMutation({
    mutationFn: async (newDebt: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");
      
      const { error } = await supabase.from("debts").insert([
        {
          ...newDebt,
          user_id: user.id,
          status: "active",
          paid_amount: 0,
        },
      ]);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Success", description: "Debt added successfully!" });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addPayment = useMutation({
    mutationFn: async ({ debtId, amount }: { debtId: string; amount: number }) => {
      const { data: debt, error: fetchError } = await supabase
        .from("debts")
        .select("*")
        .eq("id", debtId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const newPaidAmount = (debt.paid_amount || 0) + amount;
      const newStatus = newPaidAmount >= debt.amount ? "cleared" : "active";

      const { error } = await supabase
        .from("debts")
        .update({ 
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", debtId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Success", description: "Payment added successfully!" });
      setIsPaymentDialogOpen(false);
      setSelectedDebt(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateDebt = useMutation({
    mutationFn: async (updatedDebt: Partial<Debt> & { id: string }) => {
      const { error } = await supabase
        .from("debts")
        .update({ ...updatedDebt, updated_at: new Date().toISOString() })
        .eq("id", updatedDebt.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Success", description: "Debt updated successfully!" });
      setIsEditDialogOpen(false);
      setSelectedDebt(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDebt = useMutation({
    mutationFn: async (debtId: string) => {
      const { error } = await supabase
        .from("debts")
        .delete()
        .eq("id", debtId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast({ title: "Success", description: "Debt deleted successfully!" });
      setIsDeleteDialogOpen(false);
      setSelectedDebt(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsPaymentDialogOpen(true);
  };

  const handleEditDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsDetailsDialogOpen(true);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      type: "all",
    });
  };

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span role="img" aria-label="credit card">💳</span> Debt Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your debts and manage repayments efficiently.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Reports
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Debt
          </Button>
        </div>
      </div>

      <DebtSummary data={summaryData} />

      <DebtFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        onClearFilters={handleClearFilters}
      />

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="borrowed">Borrowed</TabsTrigger>
          <TabsTrigger value="lent">Lent</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="cleared">Cleared</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDebts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No debts found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedTab === "all" 
                    ? "Start by adding your first debt record." 
                    : `No debts found in the "${selectedTab}" category.`}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Debt
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDebts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onEdit={handleEditDebt}
                  onDelete={handleDeleteDebt}
                  onAddPayment={handleAddPayment}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        debt={selectedDebt}
        onSubmit={(amount) => selectedDebt && addPayment.mutate({ debtId: selectedDebt.id, amount })}
        isLoading={addPayment.isPending}
      />

      <EditDebtDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        debt={selectedDebt}
        onSubmit={(data) => selectedDebt && updateDebt.mutate({ ...data, id: selectedDebt.id })}
        isLoading={updateDebt.isPending}
      />

      <DeleteDebtDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        debt={selectedDebt}
        onConfirm={() => selectedDebt && deleteDebt.mutate(selectedDebt.id)}
        isLoading={deleteDebt.isPending}
      />

      <DebtDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        debt={selectedDebt}
      />

      <AddDebtDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(data) => addDebt.mutate(data)}
        isLoading={addDebt.isPending}
      />
    </div>
  );
};

export default Debts;
