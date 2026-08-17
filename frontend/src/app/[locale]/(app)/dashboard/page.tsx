// src/app/[locale]/(app)/dashboard/page.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  ShoppingCart,
  PackagePlus,
  Banknote,
  Receipt,
  UserPlus,
  Warehouse,
  TrendingUp,
  Users,
  Truck,
  Package,
  AlertTriangle,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

function getGreeting(t: ReturnType<typeof useTranslations>) {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard.greeting.morning");
  if (hour < 17) return t("dashboard.greeting.afternoon");
  return t("dashboard.greeting.evening");
}

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();
  const { metrics, isLoading, isError, refetch } = useDashboard();

  const greeting = getGreeting(t);

  const quickActions = [
    {
      href: "/sales/new",
      icon: ShoppingCart,
      label: t("dashboard.newSale"),
      color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20",
    },
    {
      href: "/purchases/new",
      icon: PackagePlus,
      label: t("dashboard.newPurchase"),
      color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20",
    },
    {
      href: "/customers",
      icon: Banknote,
      label: t("dashboard.receivePayment"),
      color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20",
    },
    {
      href: "/expenses",
      icon: Receipt,
      label: t("dashboard.addExpense"),
      color: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20",
    },
    {
      href: "/customers",
      icon: UserPlus,
      label: t("dashboard.addCustomer"),
      color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20",
    },
    {
      href: "/inventory",
      icon: Warehouse,
      label: t("dashboard.viewStock"),
      color: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20",
    },
  ];

  const todaySalesRupees = (metrics?.today.salesAmountPaise || 0) / 100;
  const todayProfitRupees = (metrics?.today.grossProfitPaise || 0) / 100;
  const customerPendingRupees = (metrics?.overall.totalCustomerPendingPaise || 0) / 100;
  const supplierPayableRupees = (metrics?.overall.totalSupplierPayablePaise || 0) / 100;
  const totalStockKg = metrics?.overall.totalStockKg || 0;
  const totalValuationRupees = (metrics?.overall.totalValuationPaise || 0) / 100;
  const lowStockCount = metrics?.overall.lowStockCount || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, {user?.name || ""} 👋
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {new Date().toLocaleDateString(locale === "ta" ? "ta-IN" : "en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="self-start sm:self-auto gap-1.5 h-8 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {lowStockCount} {t("dashboard.lowStock")} alert
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {metrics?.overall.lowStockProducts.map((p) => p.name).slice(0, 3).join(", ")}
                  {lowStockCount > 3 ? "..." : ""}
                </p>
              </div>
            </div>
            <Link href="/inventory">
              <Button size="sm" variant="outline" className="h-7 text-xs bg-background/80">
                View
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Primary Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Sales */}
        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t("dashboard.todaySales")}</span>
              <ShoppingCart className="h-4 w-4" />
            </div>
            <p className="text-xl sm:text-2xl font-bold rupee-display text-foreground">
              ₹{todaySalesRupees.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {metrics?.today.salesWeightKg.toLocaleString("en-IN") || 0} kg • {metrics?.today.salesCount || 0} bills
            </p>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t("dashboard.profit")} (Est)</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold rupee-display text-emerald-600">
              ₹{todayProfitRupees.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Gross profit today
            </p>
          </CardContent>
        </Card>

        {/* Customer Pending / Udhar */}
        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t("dashboard.customerPending")}</span>
              <Users className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl sm:text-2xl font-bold rupee-display text-destructive">
              ₹{customerPendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Total Udhar to collect
            </p>
          </CardContent>
        </Card>

        {/* In-Stock Weight & Valuation */}
        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t("dashboard.totalStock")}</span>
              <Package className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl sm:text-2xl font-bold weight-display text-foreground">
              {totalStockKg.toLocaleString("en-IN")} kg
            </p>
            <p className="text-[11px] text-muted-foreground rupee-display">
              Val: ₹{totalValuationRupees.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Grid */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("dashboard.quickActions")}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {quickActions.map((action) => (
            <Link key={action.href + action.label} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full active:scale-98">
                <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold leading-tight line-clamp-1">
                    {action.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Cash Flow Summary & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Cash & Credit Summary */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-muted-foreground">Cash/UPI Received:</span>
              <span className="font-bold text-success rupee-display">
                ₹{((metrics?.today.cashReceivedPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-muted-foreground">Credit / Udhar Sales:</span>
              <span className="font-bold text-destructive rupee-display">
                ₹{((metrics?.today.creditSalesPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-muted-foreground">Today's Expenses:</span>
              <span className="font-bold text-rose-600 rupee-display">
                ₹{((metrics?.today.expensesAmountPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-muted-foreground">Purchases Recorded:</span>
              <span className="font-bold text-blue-600 rupee-display">
                ₹{((metrics?.today.purchasesAmountPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 font-semibold text-sm">
              <span>Net Profit (Est):</span>
              <span className="font-bold text-primary rupee-display">
                ₹{((metrics?.today.netProfitPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions List */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            <Link href="/reports" className="text-xs text-primary hover:underline">
              View Reports →
            </Link>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {!metrics?.recentTransactions || metrics.recentTransactions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No transactions recorded today. Use Quick Actions above to begin.
              </p>
            ) : (
              <div className="space-y-2">
                {metrics.recentTransactions.map((txn) => {
                  const isSale = txn.type === "SALE";
                  const isPurchase = txn.type === "PURCHASE";
                  const isPayment = txn.type === "PAYMENT_RECEIVED";
                  const isExpense = txn.type === "EXPENSE";

                  return (
                    <div
                      key={txn.id + txn.type}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isSale || isPayment
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {isSale || isPayment ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{txn.partyName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {txn.transactionNumber} •{" "}
                            {new Date(txn.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold text-sm rupee-display ${
                            isSale || isPayment ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isSale || isPayment ? "+" : "-"}₹
                          {(txn.amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        {txn.weightKg && txn.weightKg > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {txn.weightKg} kg
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
