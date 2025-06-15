
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
import { MoreHorizontal, Edit, Trash2, PlusCircle, Filter, Calendar as CalendarIcon, Search } from "lucide-react";
import { IncomeDialog } from "@/components/incomes/IncomeDialog";
import { DeleteIncomeAlert } from "@/components/incomes/DeleteIncomeAlert";
import { Skeleton } from "@/components/ui/skeleton";
import * as z from "zod";
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
  const [showFilters, setShowFilters] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

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
      
      if (!income.income_date) return false;
      const incomeDate = new Date(income.income_date);
      
      const startDateMatch = !startDate || incomeDate >= startDate;
      const endDateMatch = !endDate || incomeDate <= endDate;
      
      return searchMatch && categoryMatch && startDateMatch && endDateMatch;
  });

  const incomeCategories = ["All", ...new Set(incomes?.map(i => i.category).filter(Boolean) as string[])];

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <span role="img" aria-label="money bag">💰</span> Incomes
              </CardTitle>
              <CardDescription>Manage your income sources and track your earnings.</CardDescription>
            </div>
            <Button onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Income
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search income..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    {incomeCategories.map(cat => (
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
                  <TableHead>Source</TableHead>
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
                ) : filteredIncomes && filteredIncomes.length > 0 ? (
                  filteredIncomes.map(income => (
                    <TableRow key={income.id}>
                      <TableCell className="font-medium">{income.source}</TableCell>
                      <TableCell className="text-right text-green-500 font-semibold">+₹{income.amount.toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell">{income.category}</TableCell>
                      <TableCell className="hidden md:table-cell text-right">{new Date(income.income_date).toLocaleDateString()}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEditClick(income)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteClick(income)}>
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
