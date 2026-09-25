// src/features/products/components/product-form-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useProducts, Product } from "../hooks/use-products";
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
import { Plus, Loader2 } from "lucide-react";

interface ProductFormDialogProps {
  product?: Product;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

const CATEGORIES = [
  "raw_paddy",
  "boiled_rice",
  "raw_rice",
  "idli_rice",
  "ponni_rice",
  "basmati_rice",
  "broken_rice",
  "bran",
  "husk",
  "other",
] as const;

const UNITS = ["kg", "quintal", "tonne", "bag"] as const;

export function ProductFormDialog({ product, trigger, onSuccess }: ProductFormDialogProps) {
  const t = useTranslations();
  const { createProduct, updateProduct } = useProducts();
  const [open, setOpen] = useState(false);

  const isEditing = !!product;

  const [name, setName] = useState(product?.name || "");
  const [nameTamil, setNameTamil] = useState(product?.nameTamil || "");
  const [category, setCategory] = useState(product?.category || "boiled_rice");
  const [unit, setUnit] = useState(product?.unit || "kg");
  const [purchasePriceRupees, setPurchasePriceRupees] = useState(
    product ? (product.purchasePricePaise / 100).toString() : ""
  );
  const [sellingPriceRupees, setSellingPriceRupees] = useState(
    product ? (product.sellingPricePaise / 100).toString() : ""
  );
  const [initialStockKg, setInitialStockKg] = useState(
    product ? product.currentStockKg.toString() : "0"
  );
  const [minimumStockKg, setMinimumStockKg] = useState(
    product ? product.minimumStockKg.toString() : "50"
  );
  const [error, setError] = useState("");

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  // Seed the form from the entity (edit mode) or blank defaults (create mode).
  const resetForm = () => {
    setName(product?.name || "");
    setNameTamil(product?.nameTamil || "");
    setCategory(product?.category || "boiled_rice");
    setUnit(product?.unit || "kg");
    setPurchasePriceRupees(product ? (product.purchasePricePaise / 100).toString() : "");
    setSellingPriceRupees(product ? (product.sellingPricePaise / 100).toString() : "");
    setInitialStockKg(product ? product.currentStockKg.toString() : "0");
    setMinimumStockKg(product ? product.minimumStockKg.toString() : "50");
    setError("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) resetForm();
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("validation.required"));
      return;
    }

    const purchasePaise = Math.round(parseFloat(purchasePriceRupees || "0") * 100);
    const sellingPaise = Math.round(parseFloat(sellingPriceRupees || "0") * 100);
    const minStock = parseFloat(minimumStockKg || "50");

    try {
      if (isEditing) {
        await updateProduct.mutateAsync({
          id: product._id,
          data: {
            name,
            nameTamil,
            category,
            unit,
            purchasePricePaise: purchasePaise,
            sellingPricePaise: sellingPaise,
            minimumStockKg: minStock,
          },
        });
      } else {
        await createProduct.mutateAsync({
          name,
          nameTamil,
          category,
          unit,
          purchasePricePaise: purchasePaise,
          sellingPricePaise: sellingPaise,
          initialStockKg: parseFloat(initialStockKg || "0"),
          minimumStockKg: minStock,
        });
        resetForm();
      }

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to save product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          {t("products.addProduct")}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("products.editProduct") : t("products.addProduct")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("products.productName")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ponni Boiled Rice"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nameTamil">{t("products.productNameTamil")}</Label>
              <Input
                id="nameTamil"
                value={nameTamil}
                onChange={(e) => setNameTamil(e.target.value)}
                placeholder="எ.கா. பொன்னி புழுங்கல்"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("products.category")}</Label>
              <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`products.categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("products.unit")}</Label>
              <Select value={unit} onValueChange={(val) => val && setUnit(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`common.${u}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchasePrice">{t("products.purchasePrice")} (₹/kg)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="45.00"
                value={purchasePriceRupees}
                onChange={(e) => setPurchasePriceRupees(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sellingPrice">{t("products.sellingPrice")} (₹/kg)</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="54.00"
                value={sellingPriceRupees}
                onChange={(e) => setSellingPriceRupees(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="initialStock">{t("products.currentStock")} (kg)</Label>
                <Input
                  id="initialStock"
                  type="number"
                  placeholder="0"
                  value={initialStockKg}
                  onChange={(e) => setInitialStockKg(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="minStock">{t("products.minimumStock")} (kg)</Label>
              <Input
                id="minStock"
                type="number"
                placeholder="50"
                value={minimumStockKg}
                onChange={(e) => setMinimumStockKg(e.target.value)}
              />
            </div>
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
