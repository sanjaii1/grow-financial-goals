
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TrendingUp } from "lucide-react";
import { UserNav } from "./UserNav";

export function AppHeader() {
  const { state, isMobile, openMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger className="shrink-0 md:hidden" />
      <div className="w-full flex-1">
        {((isCollapsed && !isMobile) || (isMobile && !openMobile)) && (
          <div className="flex items-center gap-2 animate-fade-in">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-primary">Grow</h2>
          </div>
        )}
      </div>
      <UserNav />
    </header>
  );
}
