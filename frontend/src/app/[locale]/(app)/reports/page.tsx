// src/app/[locale]/(app)/reports/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useReports } from "@/features/reports/hooks/use-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Users,
  Calendar,
  Printer,
  FileSpreadsheet,
} from "lucide-react";

export default function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [period, setPeriod] = useState<"month" | "week" | "today" | "all">("month");

  // Calculate start & end dates based on period filter
  const getDates = () => {
    const now = new Date();
    if (period === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } else if (period === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    } else if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    return {};
  };

  const dates = getDates();
  const { profitLoss, isProfitLoading, salesAnalytics, isSalesLoading } = useReports(dates);

  const revenue = (profitLoss?.revenuePaise || 0) / 100;
  const cogs = (profitLoss?.cogsPaise || 0) / 100;
  const grossProfit = (profitLoss?.grossProfitPaise || 0) / 100;
  const totalExpenses = (profitLoss?.totalExpensesPaise || 0) / 100;
  const netProfit = (profitLoss?.netProfitPaise || 0) / 100;

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("reports.title")}</h2>
          <p className="text-sm text-muted-foreground">
            Profit & Loss statements and business analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="inline-flex rounded-lg border bg-muted p-1 text-xs">
            <button
              onClick={() => setPeriod("today")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                period === "today" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                period === "week" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                period === "month" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                period === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              All Time
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pnl" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            {t("reports.profitLoss")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {t("reports.salesReport")}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profit & Loss Statement */}
        <TabsContent value="pnl" className="space-y-4">
          {isProfitLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card className="p-4 bg-muted/20">
                  <span className="text-xs text-muted-foreground block">{t("reports.revenue")}</span>
                  <span className="text-xl sm:text-2xl font-bold text-foreground rupee-display">
                    ₹{revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </Card>

                <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 block">
                    {t("reports.grossProfit")} ({profitLoss?.grossMarginPercentage || 0}%)
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-600 rupee-display">
                    ₹{grossProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </Card>

                <Card className="p-4 bg-primary/10 border-primary/30 col-span-2 sm:col-span-1">
                  <span className="text-xs text-primary block">
                    {t("reports.netProfit")} ({profitLoss?.netMarginPercentage || 0}%)
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-primary rupee-display">
                    ₹{netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </Card>
              </div>

              {/* Detailed P&L Breakdown Table */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-semibold">Statement Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 divide-y text-sm">
                  {/* Revenue */}
                  <div className="py-2.5 flex justify-between items-center font-medium">
                    <span>1. Total Sales Revenue</span>
                    <span className="font-bold text-foreground rupee-display">
                      + ₹{revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* COGS */}
                  <div className="py-2.5 flex justify-between items-center text-muted-foreground">
                    <span>2. Cost of Goods Sold (Purchase Cost at WAC)</span>
                    <span className="font-semibold text-rose-600 rupee-display">
                      - ₹{cogs.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Gross Profit Line */}
                  <div className="py-2.5 flex justify-between items-center font-bold text-emerald-600 bg-muted/20 px-2 rounded">
                    <span>= Gross Profit (மொத்த லாபம்)</span>
                    <span className="rupee-display">
                      ₹{grossProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Operating Expenses */}
                  <div className="py-3 space-y-2">
                    <div className="flex justify-between items-center font-medium text-destructive">
                      <span>3. Total Operating Expenses</span>
                      <span className="font-bold rupee-display">
                        - ₹{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {profitLoss?.expensesByCategory && profitLoss.expensesByCategory.length > 0 && (
                      <div className="pl-4 space-y-1.5 pt-1 text-xs text-muted-foreground">
                        {profitLoss.expensesByCategory.map((exp) => (
                          <div key={exp.category} className="flex justify-between items-center">
                            <span>• {t(`expenses.categories.${exp.category}` as any)} ({Math.round(exp.percentageOfExpenses)}%)</span>
                            <span className="rupee-display font-medium text-foreground">
                              ₹{(exp.amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Net Profit Line */}
                  <div className="py-3 flex justify-between items-center text-base font-bold text-primary bg-primary/10 px-2 rounded">
                    <span>= Net Profit (நிகர லாபம்)</span>
                    <span className="text-xl rupee-display">
                      ₹{netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Sales Analytics (By Product & Customer) */}
        <TabsContent value="analytics" className="space-y-4">
          {isSalesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* By Product */}
              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Sales by Product</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {!salesAnalytics?.byProduct || salesAnalytics.byProduct.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No product sales in this period.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {salesAnalytics.byProduct.map((p) => (
                        <div key={p.productId} className="p-2.5 rounded-lg bg-muted/40 text-xs space-y-1">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="text-sm">{p.productName}</span>
                            <span className="rupee-display font-bold text-primary">
                              ₹{(p.revenuePaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Qty: {p.quantityKg.toLocaleString("en-IN")} kg</span>
                            <span className="text-emerald-600 font-medium">
                              Profit: ₹{(p.profitPaise / 100).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* By Customer */}
              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Sales by Customer</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {!salesAnalytics?.byCustomer || salesAnalytics.byCustomer.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No customer sales in this period.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {salesAnalytics.byCustomer.map((c, i) => (
                        <div key={c.customerId || `cust-${i}`} className="p-2.5 rounded-lg bg-muted/40 text-xs space-y-1">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="text-sm">{c.customerName}</span>
                            <span className="rupee-display font-bold text-foreground">
                              ₹{(c.totalAmountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-success font-medium">
                              Paid: ₹{(c.paidAmountPaise / 100).toFixed(0)}
                            </span>
                            {c.creditAmountPaise > 0 && (
                              <span className="text-destructive font-medium">
                                Udhar: ₹{(c.creditAmountPaise / 100).toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
