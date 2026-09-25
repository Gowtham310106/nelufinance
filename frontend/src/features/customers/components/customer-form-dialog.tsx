// src/features/customers/components/customer-form-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomers, Customer } from "../hooks/use-customers";
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
import { UserPlus, Loader2 } from "lucide-react";

interface CustomerFormDialogProps {
  customer?: Customer;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

export function CustomerFormDialog({ customer, trigger, onSuccess }: CustomerFormDialogProps) {
  const t = useTranslations();
  const { createCustomer, updateCustomer } = useCustomers();
  const [open, setOpen] = useState(false);

  const isEditing = !!customer;

  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [openingBalanceRupees, setOpeningBalanceRupees] = useState(
    customer ? (customer.openingBalancePaise / 100).toString() : "0"
  );
  const [interestRate, setInterestRate] = useState(customer?.interestRate?.toString() || "0");
  const [notes, setNotes] = useState(customer?.notes || "");
  const [error, setError] = useState("");

  const isSubmitting = createCustomer.isPending || updateCustomer.isPending;

  // Seed the form from the entity (edit mode) or blank defaults (create mode).
  const resetForm = () => {
    setName(customer?.name || "");
    setPhone(customer?.phone || "");
    setAddress(customer?.address || "");
    setOpeningBalanceRupees(customer ? (customer.openingBalancePaise / 100).toString() : "0");
    setInterestRate(customer?.interestRate?.toString() || "0");
    setNotes(customer?.notes || "");
    setError("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) resetForm();
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError(t("validation.required"));
      return;
    }

    try {
      if (isEditing) {
        await updateCustomer.mutateAsync({
          id: customer._id,
          data: {
            name,
            phone,
            address,
            interestRate: parseFloat(interestRate || "0"),
            notes,
          },
        });
      } else {
        await createCustomer.mutateAsync({
          name,
          phone,
          address,
          openingBalancePaise: Math.round(parseFloat(openingBalanceRupees || "0") * 100),
          interestRate: parseFloat(interestRate || "0"),
          notes,
        });
        resetForm();
      }

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to save customer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button className="gap-1.5" />}>
          <UserPlus className="h-4 w-4" />
          {t("customers.addCustomer")}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("customers.editCustomer") : t("customers.addCustomer")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="c-name">{t("common.name")} *</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Murugan Hotel / Kumar"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-phone">{t("common.phone")} *</Label>
            <Input
              id="c-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-address">{t("common.address")}</Label>
            <Input
              id="c-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Bazaar Street, Salem"
            />
          </div>

          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-opening">{t("customers.openingBalance")} (₹)</Label>
                <Input
                  id="c-opening"
                  type="number"
                  placeholder="0"
                  value={openingBalanceRupees}
                  onChange={(e) => setOpeningBalanceRupees(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-vatti">Monthly Vatti (%)</Label>
                <Input
                  id="c-vatti"
                  type="number"
                  step="0.5"
                  placeholder="2.0"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="c-notes">{t("common.notes")}</Label>
            <Input
              id="c-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular hotel customer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
