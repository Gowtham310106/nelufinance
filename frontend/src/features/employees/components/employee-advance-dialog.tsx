// src/features/employees/components/employee-advance-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEmployees, Employee } from "../hooks/use-employees";
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
import { HandCoins, Loader2, AlertCircle } from "lucide-react";

interface EmployeeAdvanceDialogProps {
  employee: Employee;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function EmployeeAdvanceDialog({ employee, trigger, onSuccess }: EmployeeAdvanceDialogProps) {
  const t = useTranslations();
  const { recordTransaction } = useEmployees();
  const [open, setOpen] = useState(false);

  const [type, setType] = useState<"ADVANCE_GIVEN" | "SALARY_PAID" | "ADVANCE_DEDUCTED">(
    "ADVANCE_GIVEN"
  );
  const [amountRupees, setAmountRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amt = parseFloat(amountRupees);
    if (!amt || amt <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      await recordTransaction.mutateAsync({
        employeeId: employee._id,
        data: {
          type,
          amountPaise: Math.round(amt * 100),
          paymentMethod,
          notes,
        },
      });

      setOpen(false);
      setAmountRupees("");
      setNotes("");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to record transaction");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 text-white font-medium text-xs hover:bg-amber-600 cursor-pointer">
            <HandCoins className="h-3.5 w-3.5" />
            {t("employees.giveAdvance")} / Salary
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay / Advance: {employee.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Advance balance info */}
          <div className="p-3 rounded-lg bg-muted/40 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">{t("employees.currentAdvance")}:</span>
            <span className="font-bold text-amber-600 rupee-display text-sm">
              ₹{((employee.currentAdvancePaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label>Transaction Type *</Label>
            <Select value={type} onValueChange={(val) => val && setType(val as any)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADVANCE_GIVEN">Give Advance Loan (முன்பணம் வழங்குதல்)</SelectItem>
                <SelectItem value="SALARY_PAID">Pay Salary / Wage (சம்பளம் வழங்குதல்)</SelectItem>
                <SelectItem value="ADVANCE_DEDUCTED">Deduct Advance (முன்பணம் பிடித்தம்)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ea-amt">{t("common.amount")} (₹) *</Label>
            <Input
              id="ea-amt"
              type="number"
              step="any"
              placeholder="0.00"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="text-lg font-bold text-primary h-11"
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ea-notes">{t("common.notes")}</Label>
            <Input
              id="ea-notes"
              placeholder="e.g. Festival advance / Weekly settlement"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={recordTransaction.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={recordTransaction.isPending}>
              {recordTransaction.isPending ? (
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
