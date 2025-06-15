import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { MoreHorizontal, Edit, Trash2, PlusCircle } from "lucide-react";
import { IncomeDialog } from "@/components/incomes/IncomeDialog";
import { DeleteIncomeAlert } from "@/components/incomes/DeleteIncomeAlert";
import { Skeleton } from "@/components/ui/skeleton";
import * as z from "zod";

export type Income = {
  id: string;
  source: string;
  amount: number;
  income_date: string;
  category: string | null;
  user_id: string;
};

const formSchema = z.object({
  source: z.string().min(1, "Source is required."),
  amount: z.coerce.number().min(0.01, "Amount must be a positive number."),
  income_date: z.string().min(1, "Date is required."),
  category: z.string().min(1, "Category is required."),
});


const Incomes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  const { data: incomes, isLoading } = useQuery({
    queryKey: ["incomes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomes")
        .select("*")
        .order("income_date", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Income[];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ income, id }: { income?: z.infer<typeof formSchema>, id?: string }) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("You must be logged in.");
      }

      if (id) { // Deleting
        if (income) throw new Error("Should not provide income data when deleting");
        const { error } = await supabase.from("incomes").delete().match({ id });
        if (error) throw new Error(error.message);
        return;
      }

      if (!income) throw new Error("Income data is required for create/update.");
      
      if (selectedIncome) { // Updating
        const { error } = await supabase
          .from("incomes")
          .update({ ...income, user_id: authData.user.id })
          .match({ id: selectedIncome.id });
        if (error) throw new Error(error.message);
      } else { // Creating
        const { error } = await supabase
          .from("incomes")
          .insert([{
            source: income.source,
            amount: income.amount,
            income_date: income.income_date,
            category: income.category,
            user_id: authData.user.id
          }]);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      toast({ title: "Success", description: `Income ${selectedIncome ? "updated" : "added"} successfully.` });
      setAddEditDialogOpen(false);
      setDeleteDialogOpen(false);
      setSelectedIncome(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddClick = () => {
    setSelectedIncome(null);
    setAddEditDialogOpen(true);
  };

  const handleEditClick = (income: Income) => {
    setSelectedIncome(income);
    setAddEditDialogOpen(true);
  };

  const handleDeleteClick = (income: Income) => {
    setSelectedIncome(income);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate({ income: values });
  };
  
  const handleDeleteConfirm = () => {
    if (selectedIncome) {
      mutation.mutate({ id: selectedIncome.id });
    }
  };

  const filteredIncomes = incomes?.filter(income => {
      const searchMatch = !search || income.source.toLowerCase().includes(search.toLowerCase());
      const categoryMatch = category === 'All' || income.category === category;
      return searchMatch && categoryMatch;
  });

  const incomeCategories = ["All", ...new Set(incomes?.map(i => i.category).filter(Boolean) as string[])];

  return (
    <div className="w-full">
      <Card className="bg-slate-900 border-slate-800 text-gray-300">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <span role="img" aria-label="money bag">💰</span> Incomes
              </CardTitle>
              <CardDescription className="text-gray-400">Manage your income sources and track your earnings.</CardDescription>
            </div>
            <Button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Income
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input 
              placeholder="Search by source..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm bg-slate-800 border-slate-700 placeholder:text-gray-500 focus:ring-blue-500 focus:ring-offset-slate-900"
            />
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {incomeCategories.map(cat => (
                <Button 
                  key={cat} 
                  variant="outline"
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 ${
                    category === cat 
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
                  <TableHead className="text-gray-400">Source</TableHead>
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
                ) : filteredIncomes && filteredIncomes.length > 0 ? (
                  filteredIncomes.map(income => (
                    <TableRow key={income.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium">{income.source}</TableCell>
                      <TableCell className="text-right text-green-500 font-semibold">+₹{income.amount.toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell">{income.category}</TableCell>
                      <TableCell className="hidden md:table-cell text-right">{new Date(income.income_date).toLocaleDateString()}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEditClick(income)} className="focus:bg-slate-800 focus:text-gray-200">
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-slate-800" onClick={() => handleDeleteClick(income)}>
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
                      No incomes found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <IncomeDialog 
        isOpen={isAddEditDialogOpen}
        onClose={() => setAddEditDialogOpen(false)}
        onSubmit={handleSubmit}
        income={selectedIncome}
        isPending={mutation.isPending && !mutation.variables?.id}
      />
      <DeleteIncomeAlert
        isOpen={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isPending={mutation.isPending && !!mutation.variables?.id}
      />
    </div>
  );
};

export default Incomes;
