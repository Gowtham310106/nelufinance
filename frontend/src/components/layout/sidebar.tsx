// src/components/layout/sidebar.tsx
"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  PackagePlus,
  Warehouse,
  Users,
  Truck,
  CreditCard,
  Receipt,
  UserCog,
  BarChart3,
  Settings,
  Package,
  Scale,
  CalendarCheck,
  Coins,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SidebarItem {
  href: string;
  labelKey: string;
  /** Shown when `labelKey` is missing from the message catalog. */
  fallbackLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MAIN_ITEMS: SidebarItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/sales", labelKey: "nav.sales", icon: ShoppingCart },
  { href: "/purchases", labelKey: "nav.purchases", icon: PackagePlus },
  { href: "/inventory", labelKey: "nav.inventory", icon: Warehouse },
  { href: "/products", labelKey: "nav.products", icon: Package },
];

const SECONDARY_ITEMS: SidebarItem[] = [
  { href: "/customers", labelKey: "nav.customers", icon: Users },
  { href: "/suppliers", labelKey: "nav.suppliers", icon: Truck },
  { href: "/credit", labelKey: "nav.credit", icon: CreditCard },
  { href: "/adaku", labelKey: "nav.adaku", fallbackLabel: "Adaku (அடகு)", icon: Coins },
  { href: "/expenses", labelKey: "nav.expenses", icon: Receipt },
  { href: "/employees", labelKey: "nav.employees", icon: UserCog },
];

const TOOLS_ITEMS: SidebarItem[] = [
  { href: "/weight-reconciliation", labelKey: "nav.weightCheck", icon: Scale },
  { href: "/daily-closing", labelKey: "nav.dailyClosing", icon: CalendarCheck },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { href: "/audit-logs", labelKey: "nav.auditLogs", icon: ClipboardList },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

function NavLink({ item }: { item: SidebarItem }) {
  const t = useTranslations();
  const pathname = usePathname();

  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">
        {item.fallbackLabel && !t.has(item.labelKey)
          ? item.fallbackLabel
          : t(item.labelKey)}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const t = useTranslations();

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 flex-col border-r bg-sidebar h-screen sticky top-0">
      {/* Brand */}
      <div className="flex h-14 items-center px-4 border-b">
        <h1 className="text-xl font-bold text-primary">
          {t("common.appName")}
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {MAIN_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <Separator className="my-3" />

        {SECONDARY_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <Separator className="my-3" />

        {TOOLS_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
