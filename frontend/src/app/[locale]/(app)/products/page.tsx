// src/app/[locale]/(app)/products/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useProducts, Product } from "@/features/products/hooks/use-products";
import { ProductFormDialog } from "@/features/products/components/product-form-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, AlertTriangle, Edit, RefreshCw } from "lucide-react";

const CATEGORIES = [
  "all",
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

export default function ProductsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { products, isLoading, isError, refetch } = useProducts({
    search,
    category: category === "all" ? undefined : category,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("products.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} {t("products.title").toLowerCase()}
          </p>
        </div>
        <ProductFormDialog />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t("common.search")}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={category} onValueChange={(val) => val && setCategory(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("products.category")} />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === "all" ? t("common.all") : t(`products.categories.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center space-y-3">
          <p className="text-destructive">{t("common.error")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("common.loading")}
          </Button>
        </Card>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("common.noData")}</p>
            <p className="text-sm text-muted-foreground">
              {search ? "No products matching your search" : "Start by adding your first product"}
            </p>
          </div>
          {!search && <ProductFormDialog />}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product) => {
            const isLowStock = product.currentStockKg <= (product.minimumStockKg || 50);
            const displayName = locale === "ta" && product.nameTamil ? product.nameTamil : product.name;
            const subName = locale === "ta" ? product.name : product.nameTamil;

            return (
              <Card key={product._id} className="relative overflow-hidden hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{displayName}</h3>
                      {subName && (
                        <p className="text-xs text-muted-foreground truncate">{subName}</p>
                      )}
                    </div>
                    <ProductFormDialog
                      product={product}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center">
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {t(`products.categories.${product.category}`)}
                    </Badge>
                    {isLowStock && (
                      <Badge variant="destructive" className="text-[10px] gap-1 py-0 px-1.5">
                        <AlertTriangle className="h-3 w-3" />
                        {t("products.lowStockAlert")}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                    <div>
                      <span className="text-muted-foreground block">{t("products.currentStock")}</span>
                      <span className="font-bold text-sm weight-display">
                        {product.currentStockKg.toLocaleString("en-IN")} kg
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">{t("products.sellingPrice")}</span>
                      <span className="font-bold text-sm text-primary rupee-display">
                        ₹{(product.sellingPricePaise / 100).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">{t("products.purchasePrice")}</span>
                      <span className="font-medium rupee-display">
                        ₹{(product.purchasePricePaise / 100).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">Avg Cost</span>
                      <span className="font-medium rupee-display">
                        ₹{(product.weightedAvgCostPaisePerKg / 100).toFixed(2)}/kg
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
