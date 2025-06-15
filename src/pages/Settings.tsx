import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AvatarUpload } from "@/components/AvatarUpload";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Please enter your current password." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const isProfileChanged = fullName !== initialFullName;

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

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
      updated_at: new Date().toISOString(),
    }).eq("id", session.user.id);

    if (error) {
      toast({ title: "Profile update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully!" });
      setInitialFullName(fullName);
    }
  };
  
  const handlePasswordUpdate = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!session?.user?.email) {
      toast({ title: "Error", description: "Could not find user email.", variant: "destructive" });
      return;
    }

    // A common way to verify a user's password is to attempt to sign in.
    // If successful, the password is correct. This will also refresh the session.
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: values.currentPassword,
    });

    if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
            passwordForm.setError('currentPassword', {
                type: 'manual',
                message: 'Incorrect current password. Please try again.',
            });
        } else {
            toast({
                title: "Authentication failed",
                description: signInError.message,
                variant: "destructive",
            });
        }
        return;
    }

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Password updated successfully!" });
      passwordForm.reset();
      setIsPasswordDialogOpen(false);
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
              <AvatarUpload
                session={session}
                url={avatarUrl || `https://avatar.vercel.sh/${user.email}.png`}
                onUrlChange={setAvatarUrl}
                fallbackText={fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
              />
              <h2 className="text-xl font-semibold">{fullName || user.email}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <p className="text-muted-foreground text-xs mt-2">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-4 w-full">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4 pt-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                          {passwordForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
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
