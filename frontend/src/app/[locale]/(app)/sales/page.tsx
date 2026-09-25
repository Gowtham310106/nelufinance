// src/app/[locale]/(app)/sales/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSales, type Sale } from "@/features/sales/hooks/use-sales";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { generateSaleBillPDF } from "@/lib/pdf-generator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  ShoppingCart,
  Calendar,
  User,
  TrendingUp,
  CreditCard,
  Banknote,
  FileDown,
  Printer,
} from "lucide-react";

export default function SalesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();
  const { sales, isLoading, isError } = useSales();

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmountPaise, 0) / 100;
  const totalReceived = sales.reduce((sum, s) => sum + s.receivedAmountPaise, 0) / 100;
  const totalCredit = sales.reduce((sum, s) => sum + s.creditAmountPaise, 0) / 100;
  const totalGrossProfit = sales.reduce((sum, s) => sum + (s.grossProfitPaise || 0), 0) / 100;

  const handlePrintPDF = (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    generateSaleBillPDF(sale, {
      name: user?.name || "Vetrinel Rice Traders",
      phone: user?.phone || "",
      address: "Tamil Nadu",
    });
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sales.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {sales.length} {t("sales.title").toLowerCase()} recorded
          </p>
        </div>
        <Link href="/sales/new">
          <Button className="gap-1.5 w-full sm:w-auto bg-primary">
            <Plus className="h-4 w-4" />
            {t("sales.newSale")}
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">{t("sales.total")}</span>
          <span className="text-base sm:text-lg font-bold rupee-display">
            ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </Card>

        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">{t("sales.paid")} (Cash/UPI)</span>
          <span className="text-base sm:text-lg font-bold text-success rupee-display">
            ₹{totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </Card>

        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">{t("sales.pending")} (Udhar)</span>
          <span className="text-base sm:text-lg font-bold text-destructive rupee-display">
            ₹{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </Card>

        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">{t("dashboard.profit")}</span>
          <span className="text-base sm:text-lg font-bold text-emerald-600 rupee-display">
            ₹{totalGrossProfit.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </Card>
      </div>

      {/* Sales List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center text-destructive">{t("common.error")}</Card>
      ) : sales.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("common.noData")}</p>
            <p className="text-sm text-muted-foreground">No sales billed yet.</p>
          </div>
          <Link href="/sales/new">
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t("sales.newSale")}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {sales.map((sale) => {
            const dateStr = new Date(sale.date || sale.createdAt).toLocaleDateString(
              locale === "ta" ? "ta-IN" : "en-IN",
              { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
            );

            const totalRupees = sale.totalAmountPaise / 100;
            const creditRupees = sale.creditAmountPaise / 100;
            const profitRupees = (sale.grossProfitPaise || 0) / 100;
            const itemsSummary = sale.items
              .map((i) => `${i.productName} (${i.quantityKg}kg)`)
              .join(", ");

            return (
              <Card key={sale._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-2.5">
                  {/* Top row: Txn Number & Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-primary">
                      {sale.transactionNumber}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateStr}
                    </span>
                  </div>

                  {/* Customer & Items */}
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{sale.customerName || "Cash Customer"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {itemsSummary}
                    </p>
                  </div>

                  {/* Bottom row: Total, Profit, Payment Status & PDF button */}
                  <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base rupee-display">
                        ₹{totalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      {profitRupees > 0 && (
                        <span className="text-[11px] text-emerald-600 font-medium rupee-display">
                          Profit: ₹{profitRupees.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {t(`payments.${sale.paymentMethod}`)}
                      </Badge>
                      {creditRupees > 0 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Udhar: ₹{creditRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] text-success font-medium">
                          Paid Full
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handlePrintPDF(e, sale)}
                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF Bill
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
