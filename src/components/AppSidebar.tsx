
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  CreditCard,
  Wallet,
  DollarSign,
  Target,
  TrendingUp,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "./ui/button";

const menuItems = [
  { href: "/", title: "Dashboard", icon: Home },
  { href: "/expenses", title: "Expenses", icon: CreditCard },
  { href: "/incomes", title: "Income", icon: Wallet },
  { href: "/budgets", title: "Budget", icon: DollarSign },
  { href: "/savings", title: "Savings", icon: Target },
  { href: "/reports", title: "Reports", icon: TrendingUp },
  { href: "/analytics", title: "Analytics", icon: Clock },
  { href: "/settings", title: "Settings", icon: Settings },
];

const NavButton = ({ to, children, className }: { to: string, children: React.ReactNode, className?: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary font-semibold",
        className
      )
    }
  >
    {children}
  </NavLink>
);

export function AppSidebar() {
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed", { description: error.message });
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="flex items-center gap-2 p-4">
        {(!isCollapsed || isMobile) && (
          <>
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-primary">Grow</h2>
          </>
        )}
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <NavButton to={item.href}>
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem className="flex items-center justify-between px-3 text-muted-foreground">
            <span>Theme</span>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
             <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full justify-start"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
