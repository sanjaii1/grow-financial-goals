
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Your Finance Tracker</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Track your debts and incomes to achieve financial clarity.
          </p>
          <Button asChild>
            <Link to="/auth">Sign up / Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button asChild variant="outline">
            <Link to="/auth">Profile</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Debts</h2>
            <p className="text-muted-foreground mb-4">Manage your outstanding debts.</p>
            <Button asChild>
              <Link to="/debts">Go to Debts</Link>
            </Button>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Incomes</h2>
            <p className="text-muted-foreground mb-4">Track your sources of income.</p>
            <Button asChild>
              <Link to="/incomes">Go to Incomes</Link>
            </Button>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Expenses</h2>
            <p className="text-muted-foreground mb-4">Track and categorize your spending.</p>
            <Button asChild>
              <Link to="/expenses">Go to Expenses</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
