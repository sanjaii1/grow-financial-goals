
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Debt = {
  id: string;
  name: string;
  amount: number;
  interest_rate: number | null;
  due_date: string;
  paid_amount: number;
  created_at: string;
};

const Debts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    interest_rate: "",
    due_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDebts();
    // eslint-disable-next-line
  }, []);

  async function fetchDebts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      setDebts(data as Debt[]);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const parsedAmount = parseFloat(form.amount);
    const parsedInterest = form.interest_rate ? parseFloat(form.interest_rate) : null;

    const { error } = await supabase.from("debts").insert([
      {
        name: form.name,
        amount: parsedAmount,
        interest_rate: parsedInterest,
        due_date: form.due_date,
      },
    ]);

    setAdding(false);
    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }
    toast({ title: "Debt added" });
    setForm({ name: "", amount: "", interest_rate: "", due_date: "" });
    fetchDebts();
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">💳 Debts</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Debt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Debt Name"
                className="w-full p-2 border rounded"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Total Amount"
                className="w-full p-2 border rounded"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                min={0}
                step="0.01"
                required
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Interest Rate (%)"
                className="w-full p-2 border rounded"
                value={form.interest_rate}
                onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))}
                min={0}
                step="0.01"
              />
            </div>
            <div>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add Debt"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <h2 className="text-xl font-semibold mb-4">Your Debts</h2>
      {loading ? (
        <p>Loading...</p>
      ) : debts.length === 0 ? (
        <div className="text-center text-muted-foreground">No debts found.</div>
      ) : (
        <div className="space-y-4">
          {debts.map(debt => (
            <Card key={debt.id} className="relative overflow-hidden">
              <CardContent className="pt-4 flex flex-col md:flex-row justify-between items-center">
                <div>
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
                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (debt.paid_amount / debt.amount) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <div className="text-xs mt-1 text-right">
                    {`${Math.round(
                      Math.min(100, (debt.paid_amount / debt.amount) * 100)
                    )}% paid`}
                  </div>
                  <div className="text-xs mt-1 text-muted-foreground">
                    {(() => {
                      const days =
                        (new Date(debt.due_date).getTime() - Date.now()) /
                        (1000 * 3600 * 24);
                      if (days < 0)
                        return (
                          <span className="text-destructive">Overdue</span>
                        );
                      if (days < 7) return `Due soon (${Math.ceil(days)} days left)`;
                      return null;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Debts;
