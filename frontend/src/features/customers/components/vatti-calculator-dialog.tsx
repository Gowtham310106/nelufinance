// src/features/customers/components/vatti-calculator-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useVatti } from "../hooks/use-vatti";
import { Customer } from "../hooks/use-customers";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Printer } from "lucide-react";

interface VattiCalculatorDialogProps {
  customer: Customer;
  trigger?: React.ReactElement;
}

const RATE_PRESETS = [1.0, 1.5, 2.0, 2.5, 3.0];
const DEFAULT_RATE = 2.0;

/** Today's date as YYYY-MM-DD in the device's local timezone (not UTC). */
function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function VattiCalculatorDialog({ customer, trigger }: VattiCalculatorDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  // Only fall back to the default when no rate is set; 0% is a valid rate.
  const [rate, setRate] = useState<number>(customer.interestRate ?? DEFAULT_RATE);
  const [asOfDate, setAsOfDate] = useState<string>(() => localDateString());

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setRate(customer.interestRate ?? DEFAULT_RATE);
      setAsOfDate(localDateString());
    }
    setOpen(nextOpen);
  };

  const { vatti, isLoading } = useVatti(open ? customer._id : "", rate, asOfDate);

  const principalRupees = (vatti?.principalPaise || customer.currentBalancePaise || 0) / 100;
  const interestRupees = (vatti?.totalInterestPaise || 0) / 100;
  const totalDueRupees = (vatti?.totalDuePaise || 0) / 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5 bg-purple-600 text-white hover:bg-purple-700" />
          }
        >
          <Calculator className="h-3.5 w-3.5" />
          {t("customers.interest")} (வட்டி)
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            Vatti (வட்டி) Calculator — {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Rate & As Of Date Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Monthly Rate (வட்டி விகிதம்)</Label>
              <div className="flex flex-wrap gap-1">
                {RATE_PRESETS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRate(r)}
                    className={`px-2 py-1 text-xs rounded-md font-semibold border transition-colors ${
                      rate === r
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    ₹{r.toFixed(1)} வட்டி
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="v-asof" className="text-xs font-semibold">As of Date (கணக்கிடும் நாள்)</Label>
              <Input
                id="v-asof"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="h-8 text-xs font-semibold"
              />
            </div>
          </div>

          {/* KPI Output */}
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <span className="text-[11px] text-muted-foreground block">Principal (அசல்)</span>
                <span className="text-sm sm:text-base font-bold text-foreground rupee-display">
                  ₹{principalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
                <span className="text-[11px] text-purple-800 dark:text-purple-300 block">Interest (வட்டி)</span>
                <span className="text-sm sm:text-base font-bold text-purple-600 rupee-display">
                  ₹{interestRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-center">
                <span className="text-[11px] text-primary block">Total (மொத்தம்)</span>
                <span className="text-sm sm:text-base font-bold text-primary rupee-display">
                  ₹{totalDueRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Breakdown List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Itemized Credit Calculation Breakdown
            </h4>

            {vatti?.breakdown && vatti.breakdown.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y text-xs">
                {vatti.breakdown.map((item, idx) => (
                  <div key={idx} className="pt-1.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.days} days ({item.months} months) @ ₹{rate}/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-600 rupee-display block">
                        + ₹{(item.interestPaise / 100).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground rupee-display">
                        on ₹{(item.principalPaise / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 text-center">
                No unpaid credit bills found.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              {t("common.save")} / Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
