
import { NavLink } from "react-router-dom";
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
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const menuItems = [
  {
    href: "/",
    title: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/incomes",
    title: "Incomes",
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
];

const NavButton = ({ to, children, className }: { to: string, children: React.ReactNode, className?: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary",
        className
      )
    }
  >
    {children}
  </NavLink>
);

export function AppSidebar() {
  return (
    <Sidebar className="border-r bg-muted/40">
      <SidebarHeader>
        <h2 className="text-lg font-semibold">Finance Tracker</h2>
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
            <NavButton to="/auth">
              <User className="h-4 w-4" />
              Profile
            </NavButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex justify-center p-2">
            <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
