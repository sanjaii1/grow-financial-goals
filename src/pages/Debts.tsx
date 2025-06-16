
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

type Debt = {
  id: string;
  name: string;
  amount: number;
  interest_rate: number | null;
  due_date: string;
  paid_amount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  debt_type: string;
  status: string;
  notes: string | null;
  payment_mode: string | null;
  start_date: string | null;
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

  // Calculate summary data
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

  // Filter debts based on current filters and tab
  const filteredDebts = useMemo(() => {
    if (!debts) return [];

    return debts.filter((debt) => {
      // Search filter
      const searchMatch = 
        debt.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (debt.notes?.toLowerCase().includes(filters.search.toLowerCase()) ?? false);

      // Status filter
      const remaining = debt.amount - (debt.paid_amount || 0);
      const isOverdue = new Date(debt.due_date) < new Date() && remaining > 0;
      const status = remaining <= 0 ? "cleared" : isOverdue ? "overdue" : "active";
      const statusMatch = filters.status === "all" || filters.status === status;

      // Type filter
      const typeMatch = filters.type === "all" || filters.type === debt.debt_type;

      // Date range filter
      const debtDueDate = new Date(debt.due_date);
      const startDateMatch = !filters.startDate || debtDueDate >= filters.startDate;
      const endDateMatch = !filters.endDate || debtDueDate <= filters.endDate;

      // Tab filter
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

  const handleAddPayment = (debt: any) => {
    // TODO: Implement payment dialog
    toast({ title: "Coming Soon", description: "Payment functionality will be added" });
  };

  const handleEditDebt = (debt: any) => {
    // TODO: Implement edit dialog
    toast({ title: "Coming Soon", description: "Edit functionality will be added" });
  };

  const handleDeleteDebt = (debt: any) => {
    // TODO: Implement delete confirmation
    toast({ title: "Coming Soon", description: "Delete functionality will be added" });
  };

  const handleViewDetails = (debt: any) => {
    // TODO: Implement debt details view
    toast({ title: "Coming Soon", description: "Debt details view will be added" });
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
      {/* Header */}
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

      {/* Summary Cards */}
      <DebtSummary data={summaryData} />

      {/* Filters */}
      <DebtFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        onClearFilters={handleClearFilters}
      />

      {/* Main Content */}
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

      {/* Add Debt Dialog */}
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
