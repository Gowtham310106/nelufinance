// src/app/[locale]/(app)/customers/[id]/page.tsx
"use client";

import { use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { CustomerPaymentDialog } from "@/features/customers/components/customer-payment-dialog";
import { VattiCalculatorDialog } from "@/features/customers/components/vatti-calculator-dialog";
import { generateCustomerStatementPDF } from "@/lib/pdf-generator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  FileDown,
} from "lucide-react";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const { useCustomerLedger } = useCustomers();
  const { data: ledgerData, isLoading, isError } = useCustomerLedger(id);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !ledgerData) {
    return (
      <div className="text-center p-12 space-y-3">
        <p className="text-destructive font-semibold">Customer not found</p>
        <Button variant="outline" onClick={() => router.push("/customers")}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const { customer, entries, totalDebitPaise, totalCreditPaise, finalBalancePaise } = ledgerData;
  const finalBalanceRupees = finalBalancePaise / 100;
  const totalDebitRupees = totalDebitPaise / 100;
  const totalCreditRupees = totalCreditPaise / 100;

  const handleDownloadStatement = () => {
    generateCustomerStatementPDF(customer, entries, {
      name: user?.name || "Vetrinel Traders",
      phone: user?.phone || "",
      address: "Tamil Nadu",
    });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <div className="flex items-center gap-2">
          <VattiCalculatorDialog customer={customer} />
          <Button variant="outline" size="sm" onClick={handleDownloadStatement} className="gap-1.5 text-xs">
            <FileDown className="h-4 w-4" />
            Download PDF Statement
          </Button>
        </div>
      </div>

      {/* Customer Header Card */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{customer.phone}</span>
                </a>
                {customer.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CustomerPaymentDialog
                customer={customer}
                trigger={
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                    {t("customers.receivePayment")}
                  </Button>
                }
              />
            </div>
          </div>

          {/* Balance Overview KPIs */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t">
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-[11px] text-muted-foreground block">Total Billed</span>
              <span className="text-sm sm:text-base font-bold text-foreground rupee-display">
                ₹{totalDebitRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-[11px] text-muted-foreground block">Total Received</span>
              <span className="text-sm sm:text-base font-bold text-success rupee-display">
                ₹{totalCreditRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <span className="text-[11px] text-muted-foreground block">Balance Due</span>
              <span
                className={`text-sm sm:text-base font-bold rupee-display ${
                  finalBalanceRupees > 0 ? "text-destructive" : "text-success"
                }`}
              >
                ₹{finalBalanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">{t("customers.ledger")} ({entries.length})</h3>

        {entries.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            No transactions recorded for this customer yet.
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const dateStr = new Date(entry.date).toLocaleDateString(
                locale === "ta" ? "ta-IN" : "en-IN",
                { month: "short", day: "numeric", year: "numeric" }
              );

              const debitRupees = entry.debitPaise / 100;
              const creditRupees = entry.creditPaise / 100;
              const balanceRupees = entry.runningBalancePaise / 100;

              return (
                <Card key={entry.id + entry.date} className="p-3.5 hover:shadow-xs transition-shadow">
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{entry.description}</span>
                        {entry.transactionNumber && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {entry.transactionNumber}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateStr}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      {debitRupees > 0 && (
                        <div className="text-destructive font-semibold text-sm rupee-display">
                          + ₹{debitRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                      {creditRupees > 0 && (
                        <div className="text-success font-semibold text-sm rupee-display">
                          - ₹{creditRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                      <div className="text-[11px] text-muted-foreground">
                        Bal:{" "}
                        <span className="font-bold text-foreground rupee-display">
                          ₹{balanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
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
