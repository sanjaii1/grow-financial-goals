import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { KeyRound, Sun, Moon, Trash2, User as UserIcon } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fullName, setFullName] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [initialAvatarUrl, setInitialAvatarUrl] = useState("");
  
  const isProfileChanged = fullName !== initialFullName || avatarUrl !== initialAvatarUrl;

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setInitialFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
          setInitialAvatarUrl(data.avatar_url || "");
        }
      }
      setLoading(false);
    };

    fetchSessionAndProfile();
  }, []);

  const handleProfileUpdate = async () => {
    if (!session?.user || !isProfileChanged) return;

    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq("id", session.user.id);

    if (error) {
      toast({ title: "Profile update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully!" });
      setInitialFullName(fullName);
      setInitialAvatarUrl(avatarUrl);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!session) {
      toast({ title: "Error", description: "You must be logged in to delete your account.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.functions.invoke('delete-user', {
      method: 'POST',
    });

    if (error) {
      toast({ title: "Account deletion failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account deleted successfully", description: "You will be logged out and redirected." });
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div>Loading...</div></div>;
  }
  
  if (!session) {
      return <div className="flex justify-center items-center h-full"><div>Please log in to view settings.</div></div>;
  }

  const user = session.user;

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={fullName} />
                <AvatarFallback>{fullName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{fullName || user.email}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <p className="text-muted-foreground text-xs mt-2">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
              <Button variant="outline" className="mt-4 w-full">
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                  <div className="relative flex items-center">
                     <UserIcon className="absolute left-3 text-muted-foreground" size={16} />
                     <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                  <Input id="email" value={user.email || ''} disabled />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate} disabled={!isProfileChanged}>
                {isProfileChanged ? "Save Changes" : "No Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-3">
                 <div className="space-y-0.5">
                    <p className="text-sm font-medium">Theme Preference</p>
                    <p className="text-xs text-muted-foreground">Choose between light and dark mode</p>
                 </div>
                 <div className="flex gap-2">
                    <Button variant={theme === 'light' ? 'secondary' : 'outline'} size="icon" onClick={() => setTheme("light")}>
                        <Sun/>
                    </Button>
                    <Button variant={theme === 'dark' ? 'secondary' : 'outline'} size="icon" onClick={() => setTheme("dark")}>
                        <Moon/>
                    </Button>
                 </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive"><Trash2 className="mr-2"/>Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} className={buttonVariants({ variant: 'destructive' })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
