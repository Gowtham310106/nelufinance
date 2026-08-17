// src/app/[locale]/(app)/more/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSeed } from "@/features/seed/hooks/use-seed";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Truck,
  Receipt,
  UserCog,
  BarChart3,
  Package,
  Scale,
  CalendarCheck,
  ClipboardList,
  Sparkles,
  Loader2,
  LogOut,
  Store,
  Phone,
  Coins,
  CheckCircle2,
} from "lucide-react";

export default function MorePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { populateDemo } = useSeed();

  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleLoadDemo = async () => {
    try {
      await populateDemo.mutateAsync();
      setSeedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const operationItems = [
    {
      href: "/adaku",
      icon: Coins,
      label: "Adaku Kadan (அடகு கடன்)",
      desc: "Gold & metal pawn pledge loans with scale photos & vatti",
      color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20",
    },
    {
      href: "/daily-closing",
      icon: CalendarCheck,
      label: t("nav.dailyClosing"),
      desc: "Evening cash drawer & day locking",
      color: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20",
    },
    {
      href: "/weight-reconciliation",
      icon: Scale,
      label: t("nav.weightCheck"),
      desc: "Lorry weighbridge gross/tare verification",
      color: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20",
    },
    {
      href: "/expenses",
      icon: Receipt,
      label: t("nav.expenses"),
      desc: "Freight, loading, salary, electricity",
      color: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20",
    },
    {
      href: "/employees",
      icon: UserCog,
      label: t("nav.employees"),
      desc: "Staff directory, wages & advance loans",
      color: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20",
    },
  ];

  const masterDataItems = [
    {
      href: "/products",
      icon: Package,
      label: t("nav.products"),
      desc: "Ponni, Deluxe, IR20, Paddy varieties",
      color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20",
    },
    {
      href: "/customers",
      icon: Users,
      label: t("nav.customers"),
      desc: "Hotels, stores, Udhar ledger statements",
      color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20",
    },
    {
      href: "/suppliers",
      icon: Truck,
      label: t("nav.suppliers"),
      desc: "Rice mills, mandi vendors, payables",
      color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20",
    },
  ];

  const reportItems = [
    {
      href: "/reports",
      icon: BarChart3,
      label: t("nav.reports"),
      desc: "Profit & Loss, COGS, Net Margin analytics",
      color: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20",
    },
    {
      href: "/audit-logs",
      icon: ClipboardList,
      label: t("nav.auditLogs"),
      desc: "Immutable system activity log",
      color: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Shop Profile Banner */}
      <Card className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {user?.name || "Vetrinel Rice Traders"}
                </h2>
                <Badge variant="secondary" className="text-[10px]">
                  {user?.role?.toUpperCase() || "OWNER"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {user?.phone || ""}
                </span>
                <span>•</span>
                <span>Tamil Nadu</span>
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-destructive hover:bg-destructive/10 border-destructive/30 self-start sm:self-auto gap-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("auth.logout")}
          </Button>
        </CardContent>
      </Card>

      {/* 1-Click Demo Data Banner */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="font-bold text-sm text-foreground">
                Load Realistic Demo Shop Data
              </span>
              <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-700">
                1-Click Setup
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Loads realistic Tamil Nadu rice varieties (Ponni, Deluxe, IR20, Samba Paddy), Thanjavur suppliers, hotel customers, weighbridge tickets, and daily closing.
            </p>
          </div>

          <Button
            onClick={handleLoadDemo}
            disabled={populateDemo.isPending || seedSuccess}
            className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 text-xs gap-1.5 h-9"
          >
            {populateDemo.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Populating Data...
              </>
            ) : seedSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Data Loaded! Redirecting...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Load Demo Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Section 1: Daily Operations */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Daily Operations & Loans (தினசரி பணிகள் & கடன்)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {operationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer active:scale-98">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground">{item.label}</h4>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 2: Master Directories */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Master Directories (பட்டியல்கள்)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {masterDataItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer active:scale-98 h-full">
                <CardContent className="p-3.5 flex sm:flex-col items-center sm:items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground">{item.label}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 3: Financial Reports & Security */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Reports & Audit (அறிக்கைகள் & தணிக்கை)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {reportItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer active:scale-98">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground">{item.label}</h4>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
