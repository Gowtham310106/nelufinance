// src/app/[locale]/(app)/adaku/page.tsx
"use client";

import { useState } from "react";
import { useDebounce } from "@/lib/use-debounce";
import { Link } from "@/i18n/navigation";
import { useAdaku, type AdakuKadanItem } from "@/features/adaku/hooks/use-adaku";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { generateAdakuPawnTicketPDF } from "@/lib/pdf-generator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Coins,
  Plus,
  Search,
  Phone,
  FileDown,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function AdakuPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [statusFilter, setStatusFilter] = useState("all");

  const { pledges, isLoading, summary } = useAdaku({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
  });

  const totalLoansRupees = (summary?.totalActiveLoansPaise || 0) / 100;
  const monthlyVattiRupees = (summary?.monthlyExpectedVattiPaise || 0) / 100;

  const handleExportPDF = (e: React.MouseEvent, pledge: AdakuKadanItem) => {
    e.stopPropagation();
    generateAdakuPawnTicketPDF(pledge, {
      name: user?.name || "Vetrinel Traders",
      phone: user?.phone || "",
      address: "Tamil Nadu",
    });
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Adaku Kadan (அடகு கடன்)
          </h2>
          <p className="text-sm text-muted-foreground">
            Gold, silver & metal collateral pledge loans with monthly Vatti
          </p>
        </div>

        <Link href="/adaku/new">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-semibold">
            <Plus className="h-4 w-4" />
            New Adaku Pledge (புதிய அடகு)
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Pledges */}
        <Card className="p-3.5 bg-muted/20">
          <span className="text-[11px] text-muted-foreground block">Active Pledges</span>
          <span className="text-xl font-bold text-foreground">
            {summary?.activePledgesCount || 0} Pledges
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">In safe vault</span>
        </Card>

        {/* Total Gold Collateral */}
        <Card className="p-3.5 bg-amber-500/10 border-amber-500/30">
          <span className="text-[11px] text-amber-900 dark:text-amber-200 block">Total Gold Weight</span>
          <span className="text-xl font-bold text-amber-600 weight-display">
            {summary?.totalGoldGrams || 0} g
          </span>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5 font-semibold">
            = {summary?.totalGoldPavan || 0} Pavan (பவுன்)
          </span>
        </Card>

        {/* Total Loan Disbursed */}
        <Card className="p-3.5 bg-primary/10 border-primary/30">
          <span className="text-[11px] text-primary block">Total Loan Given</span>
          <span className="text-xl font-bold text-primary rupee-display">
            ₹{totalLoansRupees.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">Active principal</span>
        </Card>

        {/* Monthly Expected Vatti */}
        <Card className="p-3.5 bg-purple-500/10 border-purple-500/30">
          <span className="text-[11px] text-purple-900 dark:text-purple-200 block">Monthly Expected Vatti</span>
          <span className="text-xl font-bold text-purple-600 rupee-display">
            ₹{monthlyVattiRupees.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-purple-700 dark:text-purple-300 block mt-0.5 font-semibold">
            Accruing / month
          </span>
        </Card>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, phone, pledge #, or locker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "ACTIVE", "PARTIALLY_PAID", "REDEEMED", "OVERDUE"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-amber-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {st === "all" ? "All Pledges" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Pledges List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      ) : pledges.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Coins className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">No Adaku pledge loans found</p>
            <p className="text-xs text-muted-foreground">
              Create a new gold or metal pledge ticket with camera photo verification.
            </p>
          </div>
          <Link href="/adaku/new">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              Create First Pledge
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {pledges.map((pledge) => {
            const dateStr = new Date(pledge.pledgeDate).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const loanRupees = pledge.loanAmountPaise / 100;
            const pavan = (pledge.netWeightGrams / 8).toFixed(2);
            const isRedeemed = pledge.status === "REDEEMED";

            return (
              <Card
                key={pledge._id}
                className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500"
              >
                <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Scale photo thumbnail */}
                    {pledge.images && pledge.images.length > 0 ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden border shrink-0 bg-muted">
                        <img
                          src={pledge.images[0].url}
                          alt="Scale readout"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg border flex flex-col items-center justify-center bg-amber-500/10 text-amber-700 shrink-0">
                        <Coins className="h-6 w-6" />
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">
                          {pledge.customerName}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {pledge.pledgeNumber}
                        </Badge>
                        <Badge
                          variant={isRedeemed ? "secondary" : "default"}
                          className={`text-[10px] ${
                            isRedeemed
                              ? "bg-muted text-muted-foreground"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {pledge.status}
                        </Badge>
                      </div>

                      <p className="text-xs font-semibold text-foreground truncate">
                        {pledge.itemDescription} ({pledge.purityKarat})
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          {pledge.netWeightGrams} g ({pavan} Pavan)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {pledge.customerPhone}
                        </span>
                        {pledge.lockerNumber && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              {pledge.lockerNumber}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Loan Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-muted-foreground block">
                        Loan Principal
                      </span>
                      <span className="font-bold text-base rupee-display text-primary block">
                        ₹{loanRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-purple-600 font-semibold block">
                        @ ₹{pledge.monthlyVattiRate}/mo vatti
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleExportPDF(e, pledge)}
                        className="h-8 gap-1 text-xs border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF Ticket
                      </Button>

                      <Link href={`/adaku/${pledge._id}`}>
                        <Button size="sm" className="h-8 gap-1 text-xs">
                          Manage
                          <ArrowRight className="h-3.5 w-3.5" />
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
