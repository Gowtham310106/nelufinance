// src/features/inventory/components/stock-adjustment-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useInventory } from "../hooks/use-inventory";
import { useProducts } from "@/features/products/hooks/use-products";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Loader2, AlertCircle } from "lucide-react";

interface StockAdjustmentDialogProps {
  productId?: string;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

const MIN_REASON_LENGTH = 3;

export function StockAdjustmentDialog({
  productId: initialProductId,
  trigger,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { adjustStock } = useInventory();
  const { products } = useProducts({ activeOnly: true });

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(initialProductId || "");
  const [type, setType] = useState<"ADJUSTMENT_IN" | "ADJUSTMENT_OUT">("ADJUSTMENT_IN");
  const [quantityKg, setQuantityKg] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = products.find((p) => p._id === productId);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setProductId(initialProductId || "");
      setError("");
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productId) {
      setError(t("sales.selectProduct"));
      return;
    }

    const qty = parseFloat(quantityKg);
    if (!qty || qty <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }

    // Backend requires a reason of at least 3 characters.
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(
        `${t("inventory.adjustmentReason")}: ${t("validation.minLength", { min: MIN_REASON_LENGTH })}`
      );
      return;
    }

    try {
      await adjustStock.mutateAsync({
        productId,
        type,
        quantityKg: qty,
        reason: reason.trim(),
        notes,
      });

      setOpen(false);
      setQuantityKg("");
      setReason("");
      setNotes("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to adjust stock");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button variant="outline" className="gap-1.5" />}>
          <SlidersHorizontal className="h-4 w-4" />
          {t("inventory.adjustment")}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("inventory.adjustment")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product selector */}
          <div className="space-y-1.5">
            <Label>{t("purchases.product")} *</Label>
            <Select value={productId} onValueChange={(val) => val && setProductId(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("sales.selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {locale === "ta" && p.nameTamil ? p.nameTamil : p.name} (Current:{" "}
                    {p.currentStockKg} kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Type */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "ADJUSTMENT_IN" ? "default" : "outline"}
              className={`h-10 text-xs font-semibold ${
                type === "ADJUSTMENT_IN" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
              }`}
              onClick={() => setType("ADJUSTMENT_IN")}
            >
              + {t("inventory.adjustIn")}
            </Button>
            <Button
              type="button"
              variant={type === "ADJUSTMENT_OUT" ? "default" : "outline"}
              className={`h-10 text-xs font-semibold ${
                type === "ADJUSTMENT_OUT" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
              }`}
              onClick={() => setType("ADJUSTMENT_OUT")}
            >
              - {t("inventory.adjustOut")}
            </Button>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="adj-qty">{t("sales.weight")} (kg) *</Label>
            <Input
              id="adj-qty"
              type="number"
              step="any"
              placeholder="e.g. 50"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              required
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="adj-reason">{t("inventory.adjustmentReason")} *</Label>
            <Input
              id="adj-reason"
              placeholder="e.g. Bag damage / Weighbridge check / Sample"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="adj-notes">{t("common.notes")}</Label>
            <Input
              id="adj-notes"
              placeholder="Additional details (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {selectedProduct && quantityKg && (
            <div className="p-3 bg-muted rounded-md text-xs space-y-1">
              <div className="flex justify-between">
                <span>Current Stock:</span>
                <span className="font-semibold">{selectedProduct.currentStockKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span>New Stock After Adjustment:</span>
                <span className="font-bold text-primary">
                  {type === "ADJUSTMENT_IN"
                    ? selectedProduct.currentStockKg + parseFloat(quantityKg || "0")
                    : Math.max(0, selectedProduct.currentStockKg - parseFloat(quantityKg || "0"))}{" "}
                  kg
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={adjustStock.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={adjustStock.isPending}>
              {adjustStock.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("common.save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
