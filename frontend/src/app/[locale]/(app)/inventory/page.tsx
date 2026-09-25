// src/app/[locale]/(app)/inventory/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useInventory, useInventoryMovements } from "@/features/inventory/hooks/use-inventory";
import { StockAdjustmentDialog } from "@/features/inventory/components/stock-adjustment-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Warehouse,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  History,
} from "lucide-react";

export default function InventoryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [tab, setTab] = useState("stock");

  const { overview, isLoading, isError, refetch } = useInventory();
  const { data: movements, isLoading: isMovementsLoading } = useInventoryMovements();

  const totalStockKg = overview?.totalStockKg || 0;
  const totalValuation = (overview?.totalValuationPaise || 0) / 100;
  const lowStockCount = overview?.lowStockCount || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("inventory.title")}</h2>
          <p className="text-sm text-muted-foreground">
            Stock monitoring and valuation
          </p>
        </div>
        <StockAdjustmentDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">{t("inventory.currentStock")}</span>
          <span className="text-base sm:text-lg font-bold weight-display">
            {totalStockKg.toLocaleString("en-IN")} kg
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            ≈ {Math.round(totalStockKg / 75)} bags
          </span>
        </Card>

        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">Valuation</span>
          <span className="text-base sm:text-lg font-bold text-primary rupee-display">
            ₹{totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            at avg cost
          </span>
        </Card>

        <Card className="p-3">
          <span className="text-[11px] text-muted-foreground block">Low Stock</span>
          <span
            className={`text-base sm:text-lg font-bold ${
              lowStockCount > 0 ? "text-destructive" : "text-success"
            }`}
          >
            {lowStockCount} items
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            need reorder
          </span>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock" className="gap-1.5">
            <Layers className="h-4 w-4" />
            {t("inventory.currentStock")}
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-1.5">
            <History className="h-4 w-4" />
            {t("inventory.movements")}
          </TabsTrigger>
        </TabsList>

        {/* Current Stock Tab */}
        <TabsContent value="stock" className="space-y-2.5">
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
          ) : overview?.items.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
              <Warehouse className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">{t("common.noData")}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {overview?.items.map((item) => {
                const displayName = locale === "ta" && item.nameTamil ? item.nameTamil : item.name;
                const valuationRupees = item.stockValuationPaise / 100;
                const avgCostRupees = item.weightedAvgCostPaisePerKg / 100;

                return (
                  <Card key={item.productId} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate">{displayName}</h4>
                          {item.isLowStock && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                              Low
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Avg: <span className="rupee-display">₹{avgCostRupees.toFixed(1)}/kg</span>
                          </span>
                          <span>•</span>
                          <span>
                            Value: <span className="rupee-display font-medium text-foreground">
                              ₹{valuationRupees.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-base weight-display block">
                          {item.currentStockKg.toLocaleString("en-IN")} kg
                        </span>
                        <StockAdjustmentDialog
                          productId={item.productId}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-6 text-[11px] px-1.5 text-primary">
                              <SlidersHorizontal className="h-3 w-3 mr-1" />
                              Adjust
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-2.5">
          {isMovementsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          ) : !movements || movements.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              No inventory movements recorded yet.
            </Card>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => {
                const isIncoming = m.type.includes("IN");
                const dateStr = new Date(m.date).toLocaleDateString(
                  locale === "ta" ? "ta-IN" : "en-IN",
                  { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                );

                return (
                  <Card key={m._id} className="p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isIncoming
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {isIncoming ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {m.productId?.name || "Product"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {m.reason || m.referenceType || m.type} • {dateStr}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold text-sm weight-display ${
                            isIncoming ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isIncoming ? "+" : "-"}
                          {m.quantityKg.toLocaleString("en-IN")} kg
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Bal: {m.balanceAfterKg.toLocaleString("en-IN")} kg
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
