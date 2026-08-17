// src/features/suppliers/components/supplier-form-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSuppliers, Supplier } from "../hooks/use-suppliers";
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
import { Plus, Loader2 } from "lucide-react";

interface SupplierFormDialogProps {
  supplier?: Supplier;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SupplierFormDialog({ supplier, trigger, onSuccess }: SupplierFormDialogProps) {
  const t = useTranslations();
  const { createSupplier, updateSupplier } = useSuppliers();
  const [open, setOpen] = useState(false);

  const isEditing = !!supplier;

  const [name, setName] = useState(supplier?.name || "");
  const [phone, setPhone] = useState(supplier?.phone || "");
  const [address, setAddress] = useState(supplier?.address || "");
  const [notes, setNotes] = useState(supplier?.notes || "");
  const [error, setError] = useState("");

  const isSubmitting = createSupplier.isPending || updateSupplier.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError(t("validation.required"));
      return;
    }

    try {
      if (isEditing) {
        await updateSupplier.mutateAsync({
          id: supplier._id,
          data: { name, phone, address, notes },
        });
      } else {
        await createSupplier.mutateAsync({
          name,
          phone,
          address,
          notes,
        });
      }

      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to save supplier");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 cursor-pointer">
            <Plus className="h-4 w-4" />
            {t("suppliers.addSupplier")}
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("suppliers.editSupplier") : t("suppliers.addSupplier")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="s-name">{t("common.name")} *</Label>
            <Input
              id="s-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Balaji Mills / Ravi Farmer"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-phone">{t("common.phone")} *</Label>
            <Input
              id="s-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-address">{t("common.address")}</Label>
            <Input
              id="s-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Arani / Thanjavur"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-notes">{t("common.notes")}</Label>
            <Input
              id="s-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular paddy supplier"
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
