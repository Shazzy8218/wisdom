import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import OwlWidget from "@/components/OwlWidget";

export default function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="mx-auto max-w-lg min-h-screen flex flex-col">
        <MobileHeader />
        <main className="flex-1 pb-20">
          {children}
        </main>
        <BottomNav />
        <OwlWidget />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="ml-3" />
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <OwlWidget />
    </SidebarProvider>
  );
}
