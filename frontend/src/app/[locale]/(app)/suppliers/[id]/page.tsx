// src/app/[locale]/(app)/suppliers/[id]/page.tsx
"use client";

import { use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Supplier } from "@/features/suppliers/hooks/use-suppliers";
import { usePurchases } from "@/features/purchases/hooks/use-purchases";
import { usePayments } from "@/features/payments/hooks/use-payments";
import { SupplierPaymentDialog } from "@/features/suppliers/components/supplier-payment-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, MapPin, Calendar, Printer } from "lucide-react";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  // Fetch this supplier directly (the list endpoint only returns active suppliers).
  // Key sits under ["suppliers"] so list invalidations refresh it too.
  const supplierQuery = useQuery({
    queryKey: ["suppliers", "detail", id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Supplier }>(`/suppliers/${id}`);
      return res.data;
    },
  });
  const supplier = supplierQuery.data;
  const isSuppliersLoading = supplierQuery.isLoading;
  const { purchases, isLoading: isPurchasesLoading } = usePurchases({ supplierId: id });
  const { payments, isLoading: isPaymentsLoading } = usePayments({
    partyType: "SUPPLIER",
    partyId: id,
  });


  if (isSuppliersLoading || isPurchasesLoading || isPaymentsLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center p-12 space-y-3">
        <p className="text-destructive font-semibold">
          {supplierQuery.error instanceof Error ? supplierQuery.error.message : "Supplier not found"}
        </p>
        <Button variant="outline" onClick={() => router.push("/suppliers")}>
          Back to Suppliers
        </Button>
      </div>
    );
  }

  const payableRupees = (supplier.currentPayablePaise || 0) / 100;
  const totalPurchasesRupees =
    purchases.reduce((sum, p) => sum + p.totalAmountPaise, 0) / 100;
  const totalPaidRupees =
    payments.reduce((sum, p) => sum + p.amountPaise, 0) / 100;

  // Combine purchases & payments into a chronological ledger
  const entries: {
    id: string;
    date: string;
    type: "PURCHASE" | "PAYMENT_GIVEN";
    transactionNumber: string;
    description: string;
    amountRupees: number;
    paidRupees: number;
  }[] = [];

  for (const p of purchases) {
    const summary = p.items.map((i) => `${i.productName} (${i.quantityKg}kg)`).join(", ");
    entries.push({
      id: p._id,
      date: p.date,
      type: "PURCHASE",
      transactionNumber: p.transactionNumber,
      description: `Purchase: ${summary}`,
      amountRupees: p.totalAmountPaise / 100,
      paidRupees: p.paidAmountPaise / 100,
    });
  }

  for (const pay of payments) {
    entries.push({
      id: pay._id,
      date: pay.date,
      type: "PAYMENT_GIVEN",
      transactionNumber: pay.transactionNumber,
      description: `Payment Settled (${pay.paymentMethod.toUpperCase()})${pay.notes ? `: ${pay.notes}` : ""}`,
      amountRupees: 0,
      paidRupees: pay.amountPaise / 100,
    });
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="h-4 w-4" />
          Print Statement
        </Button>
      </div>

      {/* Supplier Card */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{supplier.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <a href={`tel:${supplier.phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{supplier.phone}</span>
                </a>
                {supplier.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>

            <SupplierPaymentDialog supplier={supplier} />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t">
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-[11px] text-muted-foreground block">Total Purchased</span>
              <span className="text-sm sm:text-base font-bold text-foreground rupee-display">
                ₹{totalPurchasesRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-[11px] text-muted-foreground block">Total Paid</span>
              <span className="text-sm sm:text-base font-bold text-success rupee-display">
                ₹{totalPaidRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-[11px] text-muted-foreground block">Current Payable</span>
              <span
                className={`text-sm sm:text-base font-bold rupee-display ${
                  payableRupees > 0 ? "text-destructive" : "text-success"
                }`}
              >
                ₹{payableRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">{t("suppliers.ledger")} ({entries.length})</h3>

        {entries.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            No transactions with this supplier yet.
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const dateStr = new Date(entry.date).toLocaleDateString(
                locale === "ta" ? "ta-IN" : "en-IN",
                { month: "short", day: "numeric", year: "numeric" }
              );

              return (
                <Card key={entry.id + entry.date} className="p-3.5 hover:shadow-xs transition-shadow">
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{entry.description}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {entry.transactionNumber}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateStr}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      {entry.type === "PURCHASE" ? (
                        <>
                          <div className="font-semibold text-sm rupee-display">
                            Bill: ₹{entry.amountRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[11px] text-success">
                            Paid: ₹{entry.paidRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        </>
                      ) : (
                        <div className="text-success font-semibold text-sm rupee-display">
                          Paid: ₹{entry.paidRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
