// src/app/[locale]/(app)/purchases/new/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePurchases } from "@/features/purchases/hooks/use-purchases";
import { useProducts } from "@/features/products/hooks/use-products";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import { SupplierFormDialog } from "@/features/suppliers/components/supplier-form-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface FormItem {
  id: string;
  productId: string;
  inputUnit: "kg" | "quintal" | "tonne" | "bag";
  inputQuantity: string;
  ratePerKg: string;
}

const UNITS = [
  { value: "kg", labelEn: "kg", labelTa: "கிலோ", multiplier: 1 },
  { value: "bag", labelEn: "Bag (75kg)", labelTa: "மூட்டை (75கி)", multiplier: 75 },
  { value: "quintal", labelEn: "Quintal (100kg)", labelTa: "குவிண்டால் (100கி)", multiplier: 100 },
  { value: "tonne", labelEn: "Tonne (1000kg)", labelTa: "டன் (1000கி)", multiplier: 1000 },
] as const;

export default function NewPurchasePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { products } = useProducts({ activeOnly: true });
  const { suppliers } = useSuppliers();
  const { createPurchase } = usePurchases();

  const [supplierId, setSupplierId] = useState<string>("none");
  const [items, setItems] = useState<FormItem[]>([
    { id: "1", productId: "", inputUnit: "kg", inputQuantity: "", ratePerKg: "" },
  ]);
  const [paidAmountRupees, setPaidAmountRupees] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productId: "",
        inputUnit: "kg",
        inputQuantity: "",
        ratePerKg: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof FormItem, value: string) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // If product selected, pre-fill default purchase rate
        if (field === "productId") {
          const prod = products.find((p) => p._id === value);
          if (prod && prod.purchasePricePaise > 0) {
            updated.ratePerKg = (prod.purchasePricePaise / 100).toString();
          }
        }

        return updated;
      })
    );
  };

  // Calculations — money is kept in integer paise (same rounding as the backend)
  const toPaise = (rupees: string) => Math.round((parseFloat(rupees || "0") || 0) * 100);

  const calculatedItems = items.map((item) => {
    const unitConfig = UNITS.find((u) => u.value === item.inputUnit) || UNITS[0];
    const qty = parseFloat(item.inputQuantity || "0") || 0;
    const weightKg = qty * unitConfig.multiplier;
    const ratePaise = toPaise(item.ratePerKg);
    const totalPaise = Math.round(weightKg * ratePaise);
    const totalRupees = totalPaise / 100;
    // Backend requires rate > 0 for every submitted row
    const isRateMissing = !!item.productId && qty > 0 && ratePaise <= 0;

    return { ...item, weightKg, ratePaise, totalPaise, totalRupees, isRateMissing };
  });

  const totalBillPaise = calculatedItems.reduce((sum, item) => sum + item.totalPaise, 0);
  const totalBillRupees = totalBillPaise / 100;
  const totalWeightKg = calculatedItems.reduce((sum, item) => sum + item.weightKg, 0);

  // Auto-fill paid with total unless the user typed something else
  const paidPaise = paidAmountRupees !== "" ? Math.max(0, toPaise(paidAmountRupees)) : totalBillPaise;
  const pendingPaise = Math.max(0, totalBillPaise - paidPaise);
  const pendingRupees = pendingPaise / 100;

  // Credit (unpaid balance) must be tracked against a supplier
  const needsParty = supplierId === "none" && pendingPaise > 0;
  const hasRateErrors = calculatedItems.some((item) => item.isRateMissing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    const validItems = items.filter((item) => item.productId && parseFloat(item.inputQuantity) > 0);
    if (validItems.length === 0) {
      setError(t("common.itemsRequired"));
      return;
    }
    if (hasRateErrors) {
      setError(t("purchases.rateRequired"));
      return;
    }
    if (needsParty) {
      setError(t("purchases.creditNeedsSupplier"));
      return;
    }

    try {
      await createPurchase.mutateAsync({
        supplierId: supplierId !== "none" ? supplierId : undefined,
        items: validItems.map((item) => ({
          productId: item.productId,
          inputUnit: item.inputUnit,
          inputQuantity: parseFloat(item.inputQuantity),
          ratePaisePerKg: toPaise(item.ratePerKg),
        })),
        paidAmountPaise: Math.min(paidPaise, totalBillPaise),
        paymentMethod,
        notes,
      });

      router.push("/purchases");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to record purchase");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{t("purchases.newPurchase")}</h2>
          <p className="text-xs text-muted-foreground">Record incoming paddy or rice stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Supplier Selection */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="supplier" className="text-sm font-semibold">
                {t("purchases.supplier")}
              </Label>
              <SupplierFormDialog
                trigger={
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                    <Plus className="h-3 w-3" />
                    {t("suppliers.addSupplier")}
                  </Button>
                }
              />
            </div>
            <Select value={supplierId} onValueChange={(val) => val && setSupplierId(val)}>
              <SelectTrigger id="supplier">
                <SelectValue placeholder={t("purchases.selectSupplier")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  -- Cash / Unknown Farmer --
                </SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} ({s.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">{t("sales.items")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="h-7 text-xs gap-1"
            >
              <Plus className="h-3 w-3" />
              {t("sales.addItem")}
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {items.map((item, index) => {
              const calc = calculatedItems[index];

              return (
                <div
                  key={item.id}
                  className="p-3 bg-muted/40 rounded-lg border space-y-3 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Product */}
                  <div className="space-y-1">
                    <Label className="text-xs">{t("purchases.product")} *</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => val && updateItem(item.id, "productId", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("purchases.selectProduct")} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {locale === "ta" && p.nameTamil ? p.nameTamil : p.name} (
                            {p.currentStockKg} kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity & Unit & Rate */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("purchases.weight")}</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="10"
                        value={item.inputQuantity}
                        onChange={(e) => updateItem(item.id, "inputQuantity", e.target.value)}
                        className="h-9 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">{t("products.unit")}</Label>
                      <Select
                        value={item.inputUnit}
                        onValueChange={(val) => val && updateItem(item.id, "inputUnit", val)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {locale === "ta" ? u.labelTa : u.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">{t("purchases.rate")} (₹/kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="42.0"
                        value={item.ratePerKg}
                        onChange={(e) => updateItem(item.id, "ratePerKg", e.target.value)}
                        className="h-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  {calc.isRateMissing && (
                    <div className="text-[11px] text-destructive flex items-center gap-1 bg-destructive/10 p-2 rounded">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("purchases.rateRequired")}</span>
                    </div>
                  )}

                  {/* Row Summary */}
                  {calc.weightKg > 0 && calc.totalRupees > 0 && (
                    <div className="pt-2 border-t flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        = {calc.weightKg.toLocaleString("en-IN")} kg
                      </span>
                      <span className="font-bold rupee-display text-primary">
                        ₹{calc.totalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Bill & Payment Split */}
        <Card className="bg-muted/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>Total Weight:</span>
              <span className="weight-display">{totalWeightKg.toLocaleString("en-IN")} kg</span>
            </div>

            <div className="flex justify-between items-center text-base font-bold">
              <span>{t("purchases.total")}:</span>
              <span className="text-xl text-primary rupee-display">
                ₹{totalBillRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <Label htmlFor="paid" className="text-xs">{t("purchases.paid")} (₹)</Label>
                <Input
                  id="paid"
                  type="number"
                  step="any"
                  placeholder={totalBillRupees.toString()}
                  value={paidAmountRupees}
                  onChange={(e) => setPaidAmountRupees(e.target.value)}
                  className="h-10 text-sm font-bold text-success"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t("purchases.pending")} (₹)</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-muted text-sm font-bold text-destructive">
                  ₹{pendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {needsParty && (
              <div className="text-xs text-destructive flex flex-wrap items-center gap-2 bg-destructive/10 p-2 rounded">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{t("purchases.creditNeedsSupplier")}</span>
                <button
                  type="button"
                  className="underline font-medium"
                  onClick={() => setPaidAmountRupees("")}
                >
                  {t("common.markFullyPaid")}
                </button>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">{t("purchases.paymentMethod")}</Label>
              <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("payments.cash")}</SelectItem>
                  <SelectItem value="upi">{t("payments.upi")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("payments.bank_transfer")}</SelectItem>
                  <SelectItem value="cheque">{t("payments.cheque")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs">{t("common.notes")}</Label>
              <Input
                id="notes"
                placeholder="e.g. Moisture 14%, Lorry TN-25-A-1234"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold gap-2"
          disabled={createPurchase.isPending || totalBillPaise <= 0 || needsParty || hasRateErrors}
        >
          {createPurchase.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              {t("purchases.confirmPurchase")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
