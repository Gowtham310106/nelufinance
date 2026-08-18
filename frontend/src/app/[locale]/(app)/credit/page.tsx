// src/app/[locale]/(app)/credit/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useAdaku } from "@/features/adaku/hooks/use-adaku";
import { CustomerPaymentDialog } from "@/features/customers/components/customer-payment-dialog";
import { VattiCalculatorDialog } from "@/features/customers/components/vatti-calculator-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Search,
  Phone,
  ArrowRight,
  Coins,
  Users,
  HandCoins,
} from "lucide-react";

export default function CreditPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const { customers, isLoading } = useCustomers({ search });
  const { summary } = useAdaku();

  const totalOutstandingRupees =
    customers.reduce((sum, c) => sum + (c.currentBalancePaise || 0), 0) / 100;

  // Filter customers with pending dues
  const creditCustomers = customers.filter((c) => (c.currentBalancePaise || 0) > 0);
  const totalAdakuRupees = (summary?.totalActiveLoansPaise || 0) / 100;

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("nav.credit")} (கடன் & அடகு கணக்கு)
          </h2>
          <p className="text-sm text-muted-foreground">
            Customer Udhar ledger balances and Adaku pawn collateral loans
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/customers">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Users className="h-4 w-4" />
              All Customers
            </Button>
          </Link>
          <Link href="/adaku">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs">
              <Coins className="h-4 w-4" />
              Adaku Loans (அடகு)
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Total Trade Udhar */}
        <Card className="p-4 bg-rose-500/10 border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-900 dark:text-rose-200 font-semibold block">
              Customer Trade Udhar (வாடிக்கையாளர் பாக்கி)
            </span>
            <Badge variant="destructive" className="text-[10px]">
              {creditCustomers.length} Customers
            </Badge>
          </div>
          <span className="text-2xl font-bold text-destructive rupee-display block mt-1">
            ₹{totalOutstandingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            Pending receivable from sales
          </span>
        </Card>

        {/* Total Adaku Loans */}
        <Card className="p-4 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-900 dark:text-amber-200 font-semibold block">
              Gold & Metal Adaku Loans (அடகு கடன்)
            </span>
            <Badge className="bg-amber-600 text-white text-[10px]">
              {summary?.activePledgesCount || 0} Pledges
            </Badge>
          </div>
          <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 rupee-display block mt-1">
            ₹{totalAdakuRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            Against {summary?.totalGoldGrams || 0}g ({summary?.totalGoldPavan || 0} Pavan) gold
          </span>
        </Card>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search credit customer by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {/* Credit Customers List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      ) : creditCustomers.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">No Pending Customer Udhar</p>
            <p className="text-xs text-muted-foreground">
              All customers have settled their balances.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {creditCustomers.map((cust) => {
            const dueRupees = (cust.currentBalancePaise || 0) / 100;

            return (
              <Card key={cust._id} className="hover:shadow-xs transition-shadow">
                <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{cust.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {cust.phone}
                      {cust.address && <span>• {cust.address}</span>}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-muted-foreground block">Pending Due</span>
                      <span className="font-bold text-base rupee-display text-destructive">
                        ₹{dueRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <VattiCalculatorDialog customer={cust} />

                      <CustomerPaymentDialog
                        customer={cust}
                        trigger={
                          <Button size="sm" className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700">
                            <HandCoins className="h-3.5 w-3.5" />
                            Receive
                          </Button>
                        }
                      />

                      <Link href={`/customers/${cust._id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          Ledger
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
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
