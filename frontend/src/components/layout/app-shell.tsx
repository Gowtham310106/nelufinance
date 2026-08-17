// src/components/layout/app-shell.tsx
"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { AuthGuard } from "@/features/auth/components/auth-guard";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header (hidden on desktop — sidebar has the brand) */}
          <div className="md:hidden">
            <Header />
          </div>

          {/* Page content */}
          <main className="flex-1 p-4 pb-20 md:pb-4 md:p-6">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
