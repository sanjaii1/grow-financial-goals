import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Session } from "@supabase/supabase-js";

type AuthView = "login" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (authView === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Login successful", variant: "default" });
        navigate("/");
      }
    } else {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl }
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Signup email sent", description: "Please verify your email to complete signup.", variant: "default" });
        setAuthView("login");
      }
    }
  };

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>;
  }

  // Auth form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6 space-y-6 animate-fade-in">
        <h2 className="font-bold text-2xl mb-2 text-center">
          {authView === "login" ? "Login" : "Sign up"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              autoComplete={
                authView === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading
              ? authView === "login"
                ? "Logging in..."
                : "Signing up..."
              : authView === "login"
                ? "Login"
                : "Sign up"}
          </Button>
        </form>
        <div className="text-muted-foreground text-center">
          {authView === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                className="underline hover:text-primary ml-1"
                onClick={() => setAuthView("signup")}
                type="button"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="underline hover:text-primary ml-1"
                onClick={() => setAuthView("login")}
                type="button"
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
