// src/app/[locale]/(app)/purchases/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePurchases } from "@/features/purchases/hooks/use-purchases";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, PackagePlus, ArrowRight, Calendar, User, Clock } from "lucide-react";

export default function PurchasesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { purchases, isLoading, isError } = usePurchases();

  const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmountPaise, 0) / 100;
  const totalPaid = purchases.reduce((sum, p) => sum + p.paidAmountPaise, 0) / 100;
  const totalPending = purchases.reduce((sum, p) => sum + p.pendingAmountPaise, 0) / 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("purchases.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {purchases.length} {t("purchases.title").toLowerCase()} recorded
          </p>
        </div>
        <Link href="/purchases/new">
          <Button className="gap-1.5 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t("purchases.newPurchase")}
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">{t("purchases.total")}</span>
          <span className="text-base sm:text-lg font-bold rupee-display">
            ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </Card>
        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">{t("purchases.paid")}</span>
          <span className="text-base sm:text-lg font-bold text-success rupee-display">
            ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </Card>
        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">{t("purchases.pending")}</span>
          <span className="text-base sm:text-lg font-bold text-destructive rupee-display">
            ₹{totalPending.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </Card>
      </div>

      {/* Purchases List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center text-destructive">{t("common.error")}</Card>
      ) : purchases.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <PackagePlus className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("common.noData")}</p>
            <p className="text-sm text-muted-foreground">No purchases recorded yet.</p>
          </div>
          <Link href="/purchases/new">
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t("purchases.newPurchase")}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {purchases.map((purchase) => {
            const dateStr = new Date(purchase.date || purchase.createdAt).toLocaleDateString(
              locale === "ta" ? "ta-IN" : "en-IN",
              { month: "short", day: "numeric", year: "numeric" }
            );

            const totalRupees = purchase.totalAmountPaise / 100;
            const pendingRupees = purchase.pendingAmountPaise / 100;
            const itemsSummary = purchase.items
              .map((i) => `${i.productName} (${i.quantityKg}kg)`)
              .join(", ");

            return (
              <Card key={purchase._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-2.5">
                  {/* Top row: Txn number & Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-primary">
                      {purchase.transactionNumber}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateStr}
                    </span>
                  </div>

                  {/* Supplier & Items */}
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{purchase.supplierName || "Cash Purchase"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {itemsSummary}
                    </p>
                  </div>

                  {/* Bottom row: Total, Paid & Status */}
                  <div className="pt-2 border-t flex items-center justify-between text-xs">
                    <div className="space-x-2">
                      <span className="font-bold text-sm rupee-display">
                        ₹{totalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {t(`payments.${purchase.paymentMethod}` as any)}
                      </Badge>
                    </div>

                    {pendingRupees > 0 ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Pending: ₹{pendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] text-success font-medium">
                        Paid Full
                      </Badge>
                    )}
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
