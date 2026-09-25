// src/app/[locale]/(app)/suppliers/page.tsx
"use client";

import { useState } from "react";
import { useDebounce } from "@/lib/use-debounce";
import { useTranslations } from "next-intl";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import { SupplierFormDialog } from "@/features/suppliers/components/supplier-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Truck, Phone, MapPin, Edit } from "lucide-react";

export default function SuppliersPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);

  const { suppliers, isLoading, isError } = useSuppliers({ search: debouncedSearch });

  const totalPayable = suppliers.reduce((sum, s) => sum + (s.currentPayablePaise || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("suppliers.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("suppliers.totalPayable")}:{" "}
            <span className="font-bold text-destructive rupee-display">
              ₹{(totalPayable / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <SupplierFormDialog />
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`${t("common.search")} ${t("suppliers.title").toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center text-destructive">{t("common.error")}</Card>
      ) : suppliers.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Truck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("suppliers.noSuppliers")}</p>
            <p className="text-sm text-muted-foreground">
              Add your suppliers, millers, and farmers here.
            </p>
          </div>
          {!search && <SupplierFormDialog />}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.map((supplier) => {
            const payableRupees = (supplier.currentPayablePaise || 0) / 100;

            return (
              <Card key={supplier._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{supplier.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{supplier.phone}</span>
                      </div>
                      {supplier.address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{supplier.address}</span>
                        </div>
                      )}
                    </div>
                    <SupplierFormDialog
                      supplier={supplier}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("suppliers.payable")}</span>
                    <span
                      className={`text-sm font-bold rupee-display ${
                        payableRupees > 0 ? "text-destructive" : "text-success"
                      }`}
                    >
                      ₹{payableRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
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
