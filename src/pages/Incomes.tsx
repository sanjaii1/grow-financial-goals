
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Income = {
  id: string;
  source: string;
  amount: number;
  income_date: string;
  created_at: string;
};

const Incomes = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    source: "",
    amount: "",
    income_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchIncomes();
  }, []);

  async function fetchIncomes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("incomes")
      .select("*")
      .order("income_date", { ascending: false });

    if (error) {
      toast({ title: "Error fetching incomes", description: error.message, variant: "destructive" });
    } else {
      setIncomes(data as Income[]);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add income.", variant: "destructive" });
      setAdding(false);
      return;
    }

    const { error } = await supabase.from("incomes").insert([
      {
        user_id: authData.user.id,
        source: form.source,
        amount: parseFloat(form.amount),
        income_date: form.income_date,
      },
    ]);

    setAdding(false);

    if (error) {
      toast({ title: "Error adding income", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Income added successfully." });
    setForm({ source: "", amount: "", income_date: "" });
    fetchIncomes();
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">💰 Incomes</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Income</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">Income Source</Label>
              <Input
                id="source"
                type="text"
                placeholder="e.g. Salary, Freelance"
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                min={0.01}
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income_date">Date</Label>
              <Input
                id="income_date"
                type="date"
                value={form.income_date}
                onChange={e => setForm(f => ({ ...f, income_date: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add Income"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <h2 className="text-2xl font-semibold mb-4">Your Incomes</h2>
      {loading ? (
        <p>Loading...</p>
      ) : incomes.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No income records found. Add one to get started!</div>
      ) : (
        <div className="space-y-4">
          {incomes.map(income => (
            <Card key={income.id}>
              <CardContent className="pt-6 flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{income.source}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(income.income_date).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-semibold text-lg text-green-600">
                  +₹{income.amount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Incomes;
