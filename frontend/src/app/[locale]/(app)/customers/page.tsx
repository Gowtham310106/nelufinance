// src/app/[locale]/(app)/customers/page.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { CustomerFormDialog } from "@/features/customers/components/customer-form-dialog";
import { CustomerPaymentDialog } from "@/features/customers/components/customer-payment-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Phone, MapPin, Edit, FileText, ArrowRight } from "lucide-react";

export default function CustomersPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");

  const { customers, isLoading, isError } = useCustomers({ search });

  const totalOutstanding =
    customers.reduce((sum, c) => sum + (c.currentBalancePaise || 0), 0) / 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("customers.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("customers.totalPending")}:{" "}
            <span className="font-bold text-destructive rupee-display">
              ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <CustomerFormDialog />
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`${t("common.search")} ${t("customers.title").toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers List */}
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
      ) : customers.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("customers.noCustomers")}</p>
            <p className="text-sm text-muted-foreground">
              Add customers to track credit, vatti, and payment ledgers.
            </p>
          </div>
          {!search && <CustomerFormDialog />}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.map((customer) => {
            const balanceRupees = (customer.currentBalancePaise || 0) / 100;

            return (
              <Card key={customer._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{customer.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <a
                          href={`tel:${customer.phone}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{customer.phone}</span>
                        </a>
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>

                    <CustomerFormDialog
                      customer={customer}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>

                  {/* Balance info */}
                  <div className="pt-2 border-t flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">{t("customers.balance")}</span>
                      <span
                        className={`text-base font-bold rupee-display ${
                          balanceRupees > 0 ? "text-destructive" : "text-success"
                        }`}
                      >
                        ₹{balanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {balanceRupees > 0 && <CustomerPaymentDialog customer={customer} />}
                      <Link href={`/customers/${customer._id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {t("customers.ledger")}
                        </Button>
                      </Link>
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
