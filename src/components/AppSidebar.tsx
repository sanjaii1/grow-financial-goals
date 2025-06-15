import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Banknote,
  ShoppingCart,
  CreditCard,
  PiggyBank,
  Wallet,
  LogOut,
  Settings,
  ChartBar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "./ui/button";

const menuItems = [
  {
    href: "/",
    title: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/incomes",
    title: "Income",
    icon: Banknote,
  },
  {
    href: "/expenses",
    title: "Expenses",
    icon: ShoppingCart,
  },
  {
    href: "/debts",
    title: "Debts",
    icon: CreditCard,
  },
  {
    href: "/savings",
    title: "Savings",
    icon: PiggyBank,
  },
  {
    href: "/reports",
    title: "Reports",
    icon: ChartBar,
  },
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
        <Wallet className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-primary">ExpenseTracker</h2>
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
           <SidebarMenuItem>
            <NavButton to="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </NavButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="p-2">
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
             <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-muted-foreground hover:text-primary"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
