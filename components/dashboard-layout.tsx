"use client";

import { Sidebar } from "@/components/sidebar";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";
import { AuthGuard } from "@/components/auth-guard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <main className={`min-h-screen overflow-y-auto transition-all duration-300 ${collapsed ? "ml-16" : "ml-64"}`}>
        {children}
      </main>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AuthGuard>
        <DashboardContent>{children}</DashboardContent>
      </AuthGuard>
    </SidebarProvider>
  );
}
