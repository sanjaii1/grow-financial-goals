
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTitle,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  ShoppingCart,
  PiggyBank,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    href: "/",
    title: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/debts",
    title: "Debts",
    icon: CreditCard,
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
    <Sidebar className="hidden border-r bg-muted/40 md:block">
      <SidebarHeader>
        <SidebarTitle>Finance Tracker</SidebarTitle>
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
      </SidebarFooter>
    </Sidebar>
  );
}
