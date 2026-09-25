// src/app/[locale]/(app)/sales/new/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSales } from "@/features/sales/hooks/use-sales";
import { useProducts } from "@/features/products/hooks/use-products";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { CustomerFormDialog } from "@/features/customers/components/customer-form-dialog";
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
  AlertTriangle,
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

export default function NewSalePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { products } = useProducts({ activeOnly: true });
  const { customers } = useCustomers();
  const { createSale } = useSales();

  const [customerId, setCustomerId] = useState<string>("none");
  const [items, setItems] = useState<FormItem[]>([
    { id: "1", productId: "", inputUnit: "kg", inputQuantity: "", ratePerKg: "" },
  ]);
  const [receivedAmountRupees, setReceivedAmountRupees] = useState<string>("");
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

        // If product selected, pre-fill default selling price
        if (field === "productId") {
          const prod = products.find((p) => p._id === value);
          if (prod && prod.sellingPricePaise > 0) {
            updated.ratePerKg = (prod.sellingPricePaise / 100).toString();
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
    const prod = products.find((p) => p._id === item.productId);
    const isInsufficientStock = prod ? (prod.currentStockKg || 0) < weightKg : false;
    // Backend requires rate > 0 for every submitted row
    const isRateMissing = !!item.productId && qty > 0 && ratePaise <= 0;

    return { ...item, weightKg, ratePaise, totalPaise, totalRupees, isRateMissing, prod, isInsufficientStock };
  });

  const totalBillPaise = calculatedItems.reduce((sum, item) => sum + item.totalPaise, 0);
  const totalBillRupees = totalBillPaise / 100;
  const totalWeightKg = calculatedItems.reduce((sum, item) => sum + item.weightKg, 0);

  // Auto-fill received with total unless the user typed something else
  const receivedPaise = receivedAmountRupees !== "" ? Math.max(0, toPaise(receivedAmountRupees)) : totalBillPaise;
  const creditPaise = Math.max(0, totalBillPaise - receivedPaise);
  const creditRupees = creditPaise / 100;

  // Credit (unpaid balance) must be tracked against a customer
  const needsParty = customerId === "none" && creditPaise > 0;
  const hasRateErrors = calculatedItems.some((item) => item.isRateMissing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validItems = items.filter((item) => item.productId && parseFloat(item.inputQuantity) > 0);
    if (validItems.length === 0) {
      setError(t("common.itemsRequired"));
      return;
    }
    if (hasRateErrors) {
      setError(t("sales.rateRequired"));
      return;
    }
    if (needsParty) {
      setError(t("sales.creditNeedsCustomer"));
      return;
    }

    try {
      await createSale.mutateAsync({
        customerId: customerId !== "none" ? customerId : undefined,
        items: validItems.map((item) => ({
          productId: item.productId,
          inputUnit: item.inputUnit,
          inputQuantity: parseFloat(item.inputQuantity),
          ratePaisePerKg: toPaise(item.ratePerKg),
        })),
        receivedAmountPaise: Math.min(receivedPaise, totalBillPaise),
        paymentMethod,
        notes,
      });

      router.push("/sales");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to record sale");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      {/* Top action bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{t("sales.newSale")}</h2>
          <p className="text-xs text-muted-foreground">Fast sales billing & stock deduction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Selection */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customer" className="text-sm font-semibold">
                {t("sales.customer")}
              </Label>
              <CustomerFormDialog
                trigger={
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                    <Plus className="h-3 w-3" />
                    {t("customers.addCustomer")}
                  </Button>
                }
              />
            </div>
            <Select value={customerId} onValueChange={(val) => val && setCustomerId(val)}>
              <SelectTrigger id="customer">
                <SelectValue placeholder={t("sales.selectCustomer")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  -- Cash / Walk-in Customer --
                </SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name} ({c.phone}) - Due: ₹{(c.currentBalancePaise / 100).toFixed(0)}
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

                  {/* Product selection with stock badge */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs">{t("sales.product")} *</Label>
                      {calc.prod && (
                        <span
                          className={`text-[11px] font-medium ${
                            calc.isInsufficientStock ? "text-destructive font-bold" : "text-muted-foreground"
                          }`}
                        >
                          Stock: {calc.prod.currentStockKg} kg
                        </span>
                      )}
                    </div>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => val && updateItem(item.id, "productId", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("sales.selectProduct")} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {locale === "ta" && p.nameTamil ? p.nameTamil : p.name} (Stock:{" "}
                            {p.currentStockKg} kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity, Unit & Rate */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("sales.weight")}</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="1"
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
                      <Label className="text-xs">{t("sales.rate")} (₹/kg)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="52.0"
                        value={item.ratePerKg}
                        onChange={(e) => updateItem(item.id, "ratePerKg", e.target.value)}
                        className="h-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Warning if requested exceeds available stock */}
                  {calc.isInsufficientStock && (
                    <div className="text-[11px] text-destructive flex items-center gap-1 bg-destructive/10 p-2 rounded">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Requested {calc.weightKg} kg exceeds available stock ({calc.prod?.currentStockKg} kg)
                      </span>
                    </div>
                  )}

                  {calc.isRateMissing && (
                    <div className="text-[11px] text-destructive flex items-center gap-1 bg-destructive/10 p-2 rounded">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("sales.rateRequired")}</span>
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

        {/* Bill Summary & Payment Split */}
        <Card className="bg-muted/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>Total Weight:</span>
              <span className="weight-display">{totalWeightKg.toLocaleString("en-IN")} kg</span>
            </div>

            <div className="flex justify-between items-center text-base font-bold">
              <span>{t("sales.total")}:</span>
              <span className="text-xl text-primary rupee-display">
                ₹{totalBillRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <Label htmlFor="received" className="text-xs">{t("sales.paid")} (₹)</Label>
                <Input
                  id="received"
                  type="number"
                  step="any"
                  placeholder={totalBillRupees.toString()}
                  value={receivedAmountRupees}
                  onChange={(e) => setReceivedAmountRupees(e.target.value)}
                  className="h-10 text-sm font-bold text-success"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t("sales.pending")} (₹ Udhar)</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-muted text-sm font-bold text-destructive">
                  ₹{creditRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {needsParty && (
              <div className="text-xs text-destructive flex flex-wrap items-center gap-2 bg-destructive/10 p-2 rounded">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{t("sales.creditNeedsCustomer")}</span>
                <button
                  type="button"
                  className="underline font-medium"
                  onClick={() => setReceivedAmountRupees("")}
                >
                  {t("common.markFullyPaid")}
                </button>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">{t("sales.paymentMethod")}</Label>
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
              <Label htmlFor="s-notes" className="text-xs">{t("common.notes")}</Label>
              <Input
                id="s-notes"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold gap-2"
          disabled={createSale.isPending || totalBillPaise <= 0 || needsParty || hasRateErrors}
        >
          {createSale.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              {t("sales.confirmSale")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
