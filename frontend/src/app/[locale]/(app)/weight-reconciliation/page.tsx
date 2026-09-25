// src/app/[locale]/(app)/weight-reconciliation/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useWeightReconciliation } from "@/features/weight-reconciliation/hooks/use-weight-reconciliation";
import { useProducts } from "@/features/products/hooks/use-products";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scale,
  Truck,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
} from "lucide-react";

const RECONCILIATION_ACTIONS = [
  "ACCEPT_WEIGHBRIDGE",
  "ACCEPT_BAG_COUNT",
  "SPLIT_DIFFERENCE",
  "DISPUTED",
] as const;
type ReconciliationAction = (typeof RECONCILIATION_ACTIONS)[number];

export default function WeightReconciliationPage() {
  const t = useTranslations();
  const locale = useLocale();

  const { records, isLoading, createRecord } = useWeightReconciliation();
  const { products } = useProducts({ activeOnly: true });
  const { suppliers } = useSuppliers();

  // Form State
  const [lorryNumber, setLorryNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [supplierId, setSupplierId] = useState("none");
  const [productId, setProductId] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [bagCount, setBagCount] = useState("");
  const [bagStandardWeight, setBagStandardWeight] = useState("75");
  const [actionTaken, setActionTaken] = useState<ReconciliationAction>("ACCEPT_WEIGHBRIDGE");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Live Math
  const gross = parseFloat(grossWeight || "0");
  const tare = parseFloat(tareWeight || "0");
  const netWeighbridge = Math.max(0, gross - tare);

  const bags = parseFloat(bagCount || "0");
  const stdBagWeight = parseFloat(bagStandardWeight || "75");
  const bagCalculated = bags * stdBagWeight;

  const discrepancyKg = netWeighbridge > 0 && bagCalculated > 0 ? netWeighbridge - bagCalculated : 0;
  const discrepancyPercent =
    bagCalculated > 0 ? Math.round((discrepancyKg / bagCalculated) * 10000) / 100 : 0;

  const absPercent = Math.abs(discrepancyPercent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!lorryNumber.trim() || !productId || gross <= 0 || tare <= 0 || bags <= 0) {
      setError("Please fill all required weighbridge and bag count fields");
      return;
    }

    try {
      await createRecord.mutateAsync({
        lorryNumber: lorryNumber.toUpperCase().trim(),
        driverName,
        supplierId: supplierId !== "none" ? supplierId : undefined,
        productId,
        grossWeightKg: gross,
        tareWeightKg: tare,
        bagCount: bags,
        bagStandardWeightKg: stdBagWeight,
        actionTaken,
        notes,
      });

      // Reset form
      setLorryNumber("");
      setDriverName("");
      setGrossWeight("");
      setTareWeight("");
      setBagCount("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to record weighbridge check");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("nav.weightCheck")}</h2>
        <p className="text-sm text-muted-foreground">
          Lorry weighbridge gross/tare verification against bag counts
        </p>
      </div>

      {/* Calculator & Form */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Lorry Weighbridge Ticket Entry
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Lorry & Product Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lorry-no" className="text-xs">Lorry / Vehicle No *</Label>
                <Input
                  id="lorry-no"
                  placeholder="e.g. TN-25-AB-1234"
                  value={lorryNumber}
                  onChange={(e) => setLorryNumber(e.target.value)}
                  className="font-mono uppercase text-sm font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="driver" className="text-xs">Driver Name</Label>
                <Input
                  id="driver"
                  placeholder="Driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Product *</Label>
                <Select value={productId} onValueChange={(val) => val && setProductId(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {locale === "ta" && p.nameTamil ? p.nameTamil : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Weighbridge vs Bag Counts side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Weighbridge Ticket */}
              <div className="p-3.5 rounded-lg border bg-muted/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  1. Weighbridge Ticket (எடை பாலம்)
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="gross" className="text-xs">Gross (ஏற்று எடை) kg *</Label>
                    <Input
                      id="gross"
                      type="number"
                      placeholder="e.g. 25400"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="tare" className="text-xs">Tare (காலி வண்டி) kg *</Label>
                    <Input
                      id="tare"
                      type="number"
                      placeholder="e.g. 10200"
                      value={tareWeight}
                      onChange={(e) => setTareWeight(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <span className="font-medium text-muted-foreground">Net Weighbridge Weight:</span>
                  <span className="font-bold text-sm text-foreground weight-display">
                    {netWeighbridge.toLocaleString("en-IN")} kg
                  </span>
                </div>
              </div>

              {/* Physical Bag Count */}
              <div className="p-3.5 rounded-lg border bg-muted/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  2. Physical Bag Count (மூட்டை எண்ணிக்கை)
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="bags" className="text-xs">Total Bags (மூட்டைகள்) *</Label>
                    <Input
                      id="bags"
                      type="number"
                      placeholder="e.g. 200"
                      value={bagCount}
                      onChange={(e) => setBagCount(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="std-wt" className="text-xs">Std Weight per Bag (kg)</Label>
                    <Input
                      id="std-wt"
                      type="number"
                      placeholder="75"
                      value={bagStandardWeight}
                      onChange={(e) => setBagStandardWeight(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <span className="font-medium text-muted-foreground">Bag Count Expected Weight:</span>
                  <span className="font-bold text-sm text-foreground weight-display">
                    {bagCalculated.toLocaleString("en-IN")} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Discrepancy Highlight Result Banner */}
            {netWeighbridge > 0 && bagCalculated > 0 && (
              <div
                className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  absPercent <= 0.5
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                    : absPercent <= 1.5
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                    : "bg-destructive/10 border-destructive/30 text-destructive dark:text-rose-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Weight Discrepancy:</span>
                    <Badge
                      variant={absPercent <= 0.5 ? "secondary" : "destructive"}
                      className="text-xs font-bold"
                    >
                      {discrepancyKg > 0 ? "+" : ""}
                      {discrepancyKg.toLocaleString("en-IN")} kg ({discrepancyPercent}%)
                    </Badge>
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">
                    {absPercent <= 0.5
                      ? "✓ Normal tolerance within 0.5%"
                      : absPercent <= 1.5
                      ? "⚠️ Slight moisture or scale variation (0.5% - 1.5%)"
                      : "🚨 Significant weight difference (> 1.5%). Check bag weight & tare ticket!"}
                  </p>
                </div>

                {/* Action selector */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Accepted As:</Label>
                  <Select
                    value={actionTaken}
                    onValueChange={(val) => {
                      const next = RECONCILIATION_ACTIONS.find((a) => a === val);
                      if (next) setActionTaken(next);
                    }}
                  >
                    <SelectTrigger className="w-48 bg-background h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCEPT_WEIGHBRIDGE">Accept Weighbridge ({netWeighbridge}kg)</SelectItem>
                      <SelectItem value="ACCEPT_BAG_COUNT">Accept Bag Count ({bagCalculated}kg)</SelectItem>
                      <SelectItem value="SPLIT_DIFFERENCE">Split Difference</SelectItem>
                      <SelectItem value="DISPUTED">Mark Disputed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Notes & Submit */}
            <div className="space-y-1">
              <Label htmlFor="w-notes" className="text-xs">{t("common.notes")}</Label>
              <Input
                id="w-notes"
                placeholder="e.g. Weighbridge Ticket #4582 / Moisture checked"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold gap-2"
              disabled={createRecord.isPending || netWeighbridge <= 0}
            >
              {createRecord.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Weighbridge Verification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Log */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Verification History ({records.length})</h3>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="p-4 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            ))}
          </div>
        ) : records.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
            No lorry weight checks recorded yet.
          </Card>
        ) : (
          <div className="space-y-2.5">
            {records.map((r) => {
              const dateStr = new Date(r.date || r.createdAt).toLocaleDateString(
                locale === "ta" ? "ta-IN" : "en-IN",
                { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
              );

              return (
                <Card key={r._id} className="p-3.5 hover:shadow-xs transition-shadow">
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-sm">
                          {r.lorryNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {r.productName}
                        </Badge>
                        <Badge
                          variant={Math.abs(r.discrepancyPercentage) <= 1 ? "secondary" : "destructive"}
                          className="text-[10px]"
                        >
                          Diff: {r.discrepancyKg > 0 ? "+" : ""}
                          {r.discrepancyKg} kg ({r.discrepancyPercentage}%)
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                        <span>Bridge: {r.netWeighbridgeWeightKg.toLocaleString("en-IN")} kg</span>
                        <span>•</span>
                        <span>{r.bagCount} bags ({r.bagCalculatedWeightKg.toLocaleString("en-IN")} kg)</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-sm weight-display text-foreground block">
                        {r.finalAcceptedWeightKg.toLocaleString("en-IN")} kg
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {r.actionTaken.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
