// src/features/suppliers/components/supplier-payment-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePayments } from "@/features/payments/hooks/use-payments";
import { Supplier } from "../hooks/use-suppliers";
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
import { Banknote, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface SupplierPaymentDialogProps {
  supplier: Supplier;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

export function SupplierPaymentDialog({
  supplier,
  trigger,
  onSuccess,
}: SupplierPaymentDialogProps) {
  const t = useTranslations();
  const { recordPayment } = usePayments();
  const [open, setOpen] = useState(false);

  const payableRupees = (supplier.currentPayablePaise || 0) / 100;

  const [amountRupees, setAmountRupees] = useState(payableRupees > 0 ? payableRupees.toString() : "");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Re-seed from the latest payable balance every time the dialog opens.
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setAmountRupees(payableRupees > 0 ? payableRupees.toString() : "");
      setPaymentMethod("bank_transfer");
      setReferenceNumber("");
      setNotes("");
      setError("");
    }
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
      await recordPayment.mutateAsync({
        type: "GIVEN",
        partyType: "SUPPLIER",
        partyId: supplier._id,
        amountPaise: Math.round(amt * 100),
        paymentMethod,
        referenceNumber,
        notes,
      });

      setReferenceNumber("");
      setNotes("");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to record payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Banknote className="h-3.5 w-3.5" />
          {t("suppliers.makePayment")}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("suppliers.makePayment")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier info pill */}
          <div className="p-3 bg-muted rounded-lg flex justify-between items-center text-xs">
            <div>
              <p className="font-semibold text-sm">{supplier.name}</p>
              <p className="text-muted-foreground">{supplier.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block">{t("suppliers.payable")}</span>
              <span
                className={`font-bold text-sm rupee-display ${
                  payableRupees > 0 ? "text-destructive" : "text-success"
                }`}
              >
                ₹{payableRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-pay-amt">{t("common.amount")} (₹) *</Label>
            <Input
              id="s-pay-amt"
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
                <SelectItem value="bank_transfer">{t("payments.bank_transfer")}</SelectItem>
                <SelectItem value="upi">{t("payments.upi")}</SelectItem>
                <SelectItem value="cash">{t("payments.cash")}</SelectItem>
                <SelectItem value="cheque">{t("payments.cheque")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-ref-no">Reference / Bank Transaction ID</Label>
            <Input
              id="s-ref-no"
              placeholder="e.g. IMPS/NEFT/Cheque No"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-pay-notes">{t("common.notes")}</Label>
            <Input
              id="s-pay-notes"
              placeholder="e.g. Settlement for lorry load"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={recordPayment.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {t("common.confirm")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
