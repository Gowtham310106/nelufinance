// src/features/expenses/components/expense-form-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useExpenses } from "../hooks/use-expenses";
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
import { Plus, Loader2, AlertCircle } from "lucide-react";

interface ExpenseFormDialogProps {
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = [
  "transport",
  "loading",
  "unloading",
  "electricity",
  "salary",
  "rent",
  "maintenance",
  "food",
  "fuel",
  "other",
] as const;

export function ExpenseFormDialog({ trigger, onSuccess }: ExpenseFormDialogProps) {
  const t = useTranslations();
  const { createExpense } = useExpenses();
  const [open, setOpen] = useState(false);

  const [category, setCategory] = useState<string>("transport");
  const [amountRupees, setAmountRupees] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setError("");
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amt = parseFloat(amountRupees);
    if (!amt || amt <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      await createExpense.mutateAsync({
        category,
        amountPaise: Math.round(amt * 100),
        paymentMethod,
        notes,
      });

      setOpen(false);
      setAmountRupees("");
      setNotes("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to record expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button className="gap-1.5 bg-rose-600 text-white hover:bg-rose-700" />}>
          <Plus className="h-4 w-4" />
          {t("expenses.addExpense")}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("expenses.addExpense")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t("expenses.category")} *</Label>
            <Select value={category} onValueChange={(val) => val && setCategory(val)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`expenses.categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-amt">{t("common.amount")} (₹) *</Label>
            <Input
              id="e-amt"
              type="number"
              step="any"
              placeholder="0.00"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="text-lg font-bold text-rose-600 h-11"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("sales.paymentMethod")}</Label>
            <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
              <SelectTrigger className="w-full">
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

          <div className="space-y-1.5">
            <Label htmlFor="e-notes">{t("common.notes")}</Label>
            <Input
              id="e-notes"
              placeholder="e.g. Lorry freight / Loading 200 bags"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createExpense.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={createExpense.isPending} className="bg-rose-600 hover:bg-rose-700">
              {createExpense.isPending ? (
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
