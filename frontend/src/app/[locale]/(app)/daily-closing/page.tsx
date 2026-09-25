// src/app/[locale]/(app)/daily-closing/page.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDailyClosing, DenominationCount } from "@/features/daily-closing/hooks/use-daily-closing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { todayLocal } from "@/lib/dates";
import {
  CalendarCheck,
  Coins,
  History,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const EMPTY_DENOMINATIONS: DenominationCount = {
  d500: 0,
  d200: 0,
  d100: 0,
  d50: 0,
  d20: 0,
  d10: 0,
  coins: 0,
};

export default function DailyClosingPage() {
  const t = useTranslations();

  // Local calendar date (toISOString() would give the UTC date — yesterday before 05:30 IST)
  const [selectedDate, setSelectedDate] = useState(() => todayLocal());

  const { preview, isPreviewLoading, history, submitClosing } = useDailyClosing(selectedDate);

  const [denominations, setDenominations] = useState<DenominationCount>(EMPTY_DENOMINATIONS);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // When the preview for a date arrives, prefill the counter from an existing closing so a
  // re-lock doesn't overwrite the saved counts with zeros. Tracked per date + closing id so
  // user edits aren't clobbered by background refetches.
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  const prefillKey = preview ? `${selectedDate}:${preview.existingClosing?._id ?? "new"}` : null;
  if (preview && prefillKey !== prefilledFor) {
    setPrefilledFor(prefillKey);
    const existing = preview.existingClosing;
    setDenominations({ ...EMPTY_DENOMINATIONS, ...(existing?.denominations ?? {}) });
    setNotes(existing?.notes ?? "");
  }

  const handleDateChange = (value: string) => {
    if (!value) return;
    setSelectedDate(value);
    setDenominations(EMPTY_DENOMINATIONS);
    setNotes("");
    setError("");
    setSuccessMessage("");
  };

  const updateDenomination = (denom: keyof DenominationCount, count: string) => {
    const val = parseInt(count || "0", 10);
    setDenominations((prev) => ({
      ...prev,
      [denom]: isNaN(val) ? 0 : Math.max(0, val),
    }));
  };

  // Live Calculations
  const totalDrawerRupees =
    denominations.d500 * 500 +
    denominations.d200 * 200 +
    denominations.d100 * 100 +
    denominations.d50 * 50 +
    denominations.d20 * 20 +
    denominations.d10 * 10 +
    denominations.coins * 1;

  const expectedClosingRupees = (preview?.expectedClosingCashPaise || 0) / 100;
  const varianceRupees = totalDrawerRupees - expectedClosingRupees;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      await submitClosing.mutateAsync({
        closingDate: selectedDate,
        openingCashPaise: preview?.openingCashPaise || 0,
        denominations,
        notes,
      });

      setSuccessMessage("Daily closing submitted and locked successfully!");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to submit daily closing");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("dailyClosing.title")}</h2>
          <p className="text-sm text-muted-foreground">
            Evening cash drawer reconciliation and day locking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-40 h-8 text-xs font-semibold"
          />
        </div>
      </div>

      <Tabs defaultValue="closing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="closing" className="gap-1.5">
            <Coins className="h-4 w-4" />
            {t("dailyClosing.title")}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" />
            Closing History
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Today's Closing Form */}
        <TabsContent value="closing" className="space-y-4">
          {isPreviewLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Step 1: System Cash Inflow & Outflow Preview */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    1. System Calculated Cash Balance for {selectedDate}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-2 text-xs divide-y">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">{t("dailyClosing.openingCash")}:</span>
                    <span className="font-semibold text-foreground rupee-display">
                      ₹{((preview?.openingCashPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">(+) Cash Sales Today:</span>
                    <span className="font-semibold text-success rupee-display">
                      + ₹{((preview?.cashSalesPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">(+) Cash Collections from Customers:</span>
                    <span className="font-semibold text-success rupee-display">
                      + ₹{((preview?.cashPaymentsReceivedPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">(+) Adaku Interest / Principal Received:</span>
                    <span className="font-semibold text-success rupee-display">
                      + ₹{((preview?.adakuReceiptsPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">(-) Cash Payments Given (Suppliers / Customers):</span>
                    <span className="font-semibold text-destructive rupee-display">
                      - ₹{((preview?.cashPaymentsGivenPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">(-) Cash Operating Expenses:</span>
                    <span className="font-semibold text-destructive rupee-display">
                      - ₹{((preview?.cashExpensesPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">(-) Cash Paid on Purchases:</span>
                    <span className="font-semibold text-destructive rupee-display">
                      - ₹{((preview?.purchaseCashOutPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">(-) Employee Advances Given:</span>
                    <span className="font-semibold text-destructive rupee-display">
                      - ₹{((preview?.advancesPaidPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">(-) Adaku Loans Paid Out:</span>
                    <span className="font-semibold text-destructive rupee-display">
                      - ₹{((preview?.adakuLoansOutPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 font-bold text-sm bg-muted/20 px-2 rounded">
                    <span>{t("dailyClosing.expectedCash")}:</span>
                    <span className="text-base text-primary rupee-display">
                      ₹{expectedClosingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Physical Cash Denomination Counter */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    2. Physical Cash Drawer Denomination Counter (பணப்பெட்டி எண்ணுதல்)
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* 500 */}
                    <div className="space-y-1 p-2 rounded-lg bg-muted/40 border">
                      <Label htmlFor="d500" className="text-xs font-bold text-muted-foreground">₹500 Notes</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="d500"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={denominations.d500 || ""}
                          onChange={(e) => updateDenomination("d500", e.target.value)}
                          className="h-9 text-sm font-bold"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground block text-right">
                        = ₹{(denominations.d500 * 500).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* 200 */}
                    <div className="space-y-1 p-2 rounded-lg bg-muted/40 border">
                      <Label htmlFor="d200" className="text-xs font-bold text-muted-foreground">₹200 Notes</Label>
                      <Input
                        id="d200"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={denominations.d200 || ""}
                        onChange={(e) => updateDenomination("d200", e.target.value)}
                        className="h-9 text-sm font-bold"
                      />
                      <span className="text-[10px] text-muted-foreground block text-right">
                        = ₹{(denominations.d200 * 200).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* 100 */}
                    <div className="space-y-1 p-2 rounded-lg bg-muted/40 border">
                      <Label htmlFor="d100" className="text-xs font-bold text-muted-foreground">₹100 Notes</Label>
                      <Input
                        id="d100"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={denominations.d100 || ""}
                        onChange={(e) => updateDenomination("d100", e.target.value)}
                        className="h-9 text-sm font-bold"
                      />
                      <span className="text-[10px] text-muted-foreground block text-right">
                        = ₹{(denominations.d100 * 100).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* 50 */}
                    <div className="space-y-1 p-2 rounded-lg bg-muted/40 border">
                      <Label htmlFor="d50" className="text-xs font-bold text-muted-foreground">₹50 Notes</Label>
                      <Input
                        id="d50"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={denominations.d50 || ""}
                        onChange={(e) => updateDenomination("d50", e.target.value)}
                        className="h-9 text-sm font-bold"
                      />
                      <span className="text-[10px] text-muted-foreground block text-right">
                        = ₹{(denominations.d50 * 50).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* 20 */}
                    <div className="space-y-1 p-2 rounded-lg bg-muted/40 border">
                      <Label htmlFor="d20" className="text-xs font-bold text-muted-foreground">₹20 Notes</Label>
                      <Input
                        id="d20"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={denominations.d20 || ""}
                        onChange={(e) => updateDenomination("d20", e.target.value)}
                        className="h-9 text-sm font-bold"
                      />
                      <span className="text-[10px] text-muted-foreground block text-right">
                        = ₹{(denominations.d20 * 20).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* 10 */}
                    <div className="space-y-1 p-2 rounded-lg bg-muted/40 border">
                      <Label htmlFor="d10" className="text-xs font-bold text-muted-foreground">₹10 Notes</Label>
                      <Input
                        id="d10"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={denominations.d10 || ""}
                        onChange={(e) => updateDenomination("d10", e.target.value)}
                        className="h-9 text-sm font-bold"
                      />
                      <span className="text-[10px] text-muted-foreground block text-right">
                        = ₹{(denominations.d10 * 10).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Coins */}
                    <div className="space-y-1 p-2 rounded-lg bg-muted/40 border col-span-2">
                      <Label htmlFor="coins" className="text-xs font-bold text-muted-foreground">Coins / Change (நாணயங்கள்)</Label>
                      <Input
                        id="coins"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={denominations.coins || ""}
                        onChange={(e) => updateDenomination("coins", e.target.value)}
                        className="h-9 text-sm font-bold"
                      />
                      <span className="text-[10px] text-muted-foreground block text-right">
                        = ₹{(denominations.coins * 1).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Summary & Variance Comparison */}
                  <div
                    className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      varianceRupees === 0
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                        : varianceRupees > 0
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200"
                        : "bg-destructive/10 border-destructive/30 text-destructive dark:text-rose-200"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{t("dailyClosing.actualCash")}</span>
                      <span className="text-2xl font-bold rupee-display">
                        ₹{totalDrawerRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold block">{t("dailyClosing.variance")}</span>
                      <Badge
                        variant={varianceRupees === 0 ? "secondary" : "destructive"}
                        className="text-sm font-bold px-2 py-0.5"
                      >
                        {varianceRupees === 0
                          ? "✓ Tally (சரியாக உள்ளது)"
                          : varianceRupees > 0
                          ? `+ ₹${varianceRupees.toLocaleString("en-IN")} (Excess / அதிகம்)`
                          : `- ₹${Math.abs(varianceRupees).toLocaleString("en-IN")} (Shortage / குறைவு)`}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="close-notes" className="text-xs">{t("common.notes")}</Label>
                    <Input
                      id="close-notes"
                      placeholder="e.g. Verified by Murugan / ₹50 shortage in change"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-semibold gap-2"
                    disabled={submitClosing.isPending}
                  >
                    {submitClosing.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        {preview?.alreadyClosed ? "Update & Re-lock Closing" : "Confirm & Lock Day Closing"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </form>
          )}
        </TabsContent>

        {/* Tab 2: History of daily closings */}
        <TabsContent value="history" className="space-y-3">
          <h3 className="text-base font-semibold">Closing Records ({history.length})</h3>

          {history.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              No daily closing records yet.
            </Card>
          ) : (
            <div className="space-y-2.5">
              {history.map((record) => {
                const isTally = record.cashVariancePaise === 0;
                const variance = record.cashVariancePaise / 100;

                return (
                  <Card key={record._id} className="p-3.5 hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{record.closingDate}</span>
                          <Badge variant={isTally ? "secondary" : "destructive"} className="text-[10px]">
                            {isTally ? "Tally" : variance > 0 ? `+₹${variance}` : `-₹${Math.abs(variance)}`}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Drawer: ₹{(record.actualCashInDrawerPaise / 100).toLocaleString("en-IN")} • Expected: ₹
                          {(record.expectedClosingCashPaise / 100).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">
                          {record.closedBy?.name || "Owner"}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
