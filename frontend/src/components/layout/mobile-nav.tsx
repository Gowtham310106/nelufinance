// src/components/layout/mobile-nav.tsx
"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  PackagePlus,
  Warehouse,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/sales", labelKey: "nav.sales", icon: ShoppingCart },
  { href: "/purchases", labelKey: "nav.purchases", icon: PackagePlus },
  { href: "/inventory", labelKey: "nav.inventory", icon: Warehouse },
  { href: "/more", labelKey: "nav.more", icon: MoreHorizontal },
];

export function MobileNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1.5 min-w-[60px] rounded-xl transition-all active:scale-95",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium",
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive ? "stroke-[2.5px] text-primary" : "text-muted-foreground")}
              />
              <span className="text-[10px] leading-none tracking-tight">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
