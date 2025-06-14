
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type AuthView = "login" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile info
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Set up auth state and fetch profile
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sessionData) => {
      setSession(sessionData);
      setUser(sessionData?.user ?? null);
      if (sessionData?.user) {
        fetchProfile(sessionData.user.id);
        // When logged in, go to home
        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        navigate("/", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

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
      }
    } else {
      // Signup flow
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUsername("");
    setAvatarUrl("");
    navigate("/auth", { replace: true });
  };

  // Fetch profile from Supabase
  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setUsername(data.username || "");
      setAvatarUrl(data.avatar_url || "");
    }
    setProfileLoading(false);
  };

  // Update profile details
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !user) return;
    setProfileLoading(true);
    const { error } = await supabase.from("profiles").update({
      username,
      avatar_url: avatarUrl
    }).eq("id", user.id);
    setProfileLoading(false);
    if (error) {
      toast({ title: "Profile update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", variant: "default" });
    }
  };

  // If user is logged in, show profile
  if (user && session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6 space-y-6 animate-fade-in">
          <h2 className="font-bold text-2xl mb-2 text-center">Profile</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Avatar URL</label>
              <Input
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
          <Button onClick={handleLogout} variant="destructive" className="w-full mt-2">
            Logout
          </Button>
        </div>
      </div>
    );
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
