// src/app/[locale]/(app)/adaku/[id]/page.tsx
"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAdaku } from "@/features/adaku/hooks/use-adaku";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  generateAdakuPawnTicketPDF,
  generateAdakuPaymentReceiptPDF,
} from "@/lib/pdf-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Coins,
  FileDown,
  Phone,
  Lock,
  Loader2,
  AlertCircle,
  HandCoins,
  Printer,
  Maximize2,
} from "lucide-react";

type PayType = "INTEREST_ONLY" | "PRINCIPAL_REDUCTION" | "FULL_REDEMPTION";
const PAY_TYPES: readonly PayType[] = ["INTEREST_ONLY", "PRINCIPAL_REDUCTION", "FULL_REDEMPTION"];

export default function AdakuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const { usePledgeDetail, usePledgeVatti, recordPayment } = useAdaku();
  const { data, isLoading, isError, refetch } = usePledgeDetail(id);
  const { data: vattiData, isLoading: isVattiLoading } = usePledgeVatti(id);

  // Settlement Dialog State
  const [payOpen, setPayOpen] = useState(false);
  const [payType, setPayType] = useState<PayType>("INTEREST_ONLY");
  const [interestRupees, setInterestRupees] = useState("");
  const [principalRupees, setPrincipalRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Photo Zoom Modal State
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data?.pledge) {
    return (
      <div className="text-center p-12 space-y-3">
        <p className="text-destructive font-semibold">Pledge ticket not found</p>
        <Button variant="outline" onClick={() => router.push("/adaku")}>
          Back to Adaku Directory
        </Button>
      </div>
    );
  }

  const { pledge, payments } = data;
  const pavan = (pledge.netWeightGrams / 8).toFixed(2);
  const loanRupees = pledge.loanAmountPaise / 100;
  const isRedeemed = pledge.status === "REDEEMED";

  const pendingInterestRupees = (vattiData?.pendingInterestPaise || 0) / 100;
  const totalRedemptionRupees = (vattiData?.totalRedemptionAmountPaise || 0) / 100;

  const handleDownloadTicket = () => {
    generateAdakuPawnTicketPDF(pledge, {
      name: user?.name || "Vetrinel Traders",
      phone: user?.phone || "",
      address: "Tamil Nadu",
    });
  };

  // Prefill amounts for the chosen payment type from the live vatti calculation
  const applyPayType = (type: PayType) => {
    setPayType(type);
    if (type === "INTEREST_ONLY") {
      setInterestRupees(pendingInterestRupees > 0 ? pendingInterestRupees.toString() : "");
      setPrincipalRupees("");
    } else if (type === "FULL_REDEMPTION") {
      setInterestRupees(pendingInterestRupees.toString());
      setPrincipalRupees(loanRupees.toString());
    } else {
      setInterestRupees("");
      setPrincipalRupees("");
    }
  };

  // Reset the settlement form every time the dialog opens (default: interest-only, prefilled)
  const handlePayOpenChange = (open: boolean) => {
    if (open) {
      applyPayType("INTEREST_ONLY");
      setPaymentMethod("cash");
      setNotes("");
      setError("");
    }
    setPayOpen(open);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Only send the amounts that belong to the selected type (hidden fields may hold stale values)
    const intAmt = payType === "PRINCIPAL_REDUCTION" ? 0 : parseFloat(interestRupees || "0") || 0;
    const prinAmt = payType === "INTEREST_ONLY" ? 0 : parseFloat(principalRupees || "0") || 0;

    if (payType === "INTEREST_ONLY" && intAmt <= 0) {
      setError("Please enter interest amount to collect");
      return;
    }
    if (payType === "PRINCIPAL_REDUCTION" && prinAmt <= 0) {
      setError("Please enter principal reduction amount");
      return;
    }

    try {
      const createdPayment = await recordPayment.mutateAsync({
        id: pledge._id,
        data: {
          type: payType,
          interestAmountPaise: Math.round(intAmt * 100),
          principalAmountPaise:
            payType === "FULL_REDEMPTION"
              ? pledge.loanAmountPaise
              : Math.round(prinAmt * 100),
          paymentMethod,
          notes,
        },
      });

      setPayOpen(false);
      setInterestRupees("");
      setPrincipalRupees("");
      setNotes("");
      setPaymentMethod("cash");
      setPayType("INTEREST_ONLY");
      refetch();

      // Download payment receipt
      generateAdakuPaymentReceiptPDF(createdPayment, pledge, {
        name: user?.name || "Vetrinel Traders",
        phone: user?.phone || "",
        address: "Tamil Nadu",
      });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to record payment");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/adaku")} className="gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          Back to Adaku
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTicket}
            className="gap-1.5 text-xs border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
          >
            <FileDown className="h-4 w-4" />
            Download PDF Ticket
          </Button>

          {!isRedeemed && (
            <Dialog open={payOpen} onOpenChange={handlePayOpenChange}>
              <DialogTrigger>
                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 cursor-pointer">
                  <HandCoins className="h-4 w-4" />
                  Collect Vatti / Redeem
                </span>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Settle / Redeem — {pledge.pledgeNumber}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Payment Type *</Label>
                    <Select
                      value={payType}
                      onValueChange={(val) => {
                        const next = PAY_TYPES.find((type) => type === val);
                        if (next) applyPayType(next);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTEREST_ONLY">Monthly Vatti Collection (வட்டி மட்டும்)</SelectItem>
                        <SelectItem value="PRINCIPAL_REDUCTION">Partial Principal Repayment (அசல் குறைப்பு)</SelectItem>
                        <SelectItem value="FULL_REDEMPTION">Full Loan Redemption & Release (பொருள் மீட்பு)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(payType === "INTEREST_ONLY" || payType === "FULL_REDEMPTION") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="v-int" className="text-xs">Interest Amount (வட்டி தொகை) (₹)</Label>
                      <Input
                        id="v-int"
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={interestRupees}
                        onChange={(e) => setInterestRupees(e.target.value)}
                        className="text-base font-bold text-purple-600"
                      />
                    </div>
                  )}

                  {(payType === "PRINCIPAL_REDUCTION" || payType === "FULL_REDEMPTION") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="v-prin" className="text-xs">Principal Amount (அசல் தொகை) (₹)</Label>
                      <Input
                        id="v-prin"
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={principalRupees}
                        onChange={(e) => setPrincipalRupees(e.target.value)}
                        className="text-base font-bold text-primary"
                        disabled={payType === "FULL_REDEMPTION"}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("sales.paymentMethod")}</Label>
                    <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t("payments.cash")}</SelectItem>
                        <SelectItem value="upi">{t("payments.upi")}</SelectItem>
                        <SelectItem value="bank_transfer">{t("payments.bank_transfer")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="v-notes" className="text-xs">{t("common.notes")}</Label>
                    <Input
                      id="v-notes"
                      placeholder="e.g. 2 months interest collected in cash"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit" disabled={recordPayment.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                      {recordPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Print Receipt"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Main Pledge Information Card */}
      <Card className="border-t-4 border-t-amber-500">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{pledge.itemDescription}</h2>
                <Badge variant={isRedeemed ? "secondary" : "default"} className="font-semibold">
                  {pledge.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-primary">{pledge.pledgeNumber}</span>
                <span>•</span>
                <span>Pledge Date: {new Date(pledge.pledgeDate).toLocaleDateString("en-IN")}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  {pledge.lockerNumber || "Safe Locker"}
                </span>
              </p>
            </div>

            <div className="text-right p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <span className="text-[11px] text-amber-900 dark:text-amber-200 block">Loan Principal</span>
              <span className="text-xl sm:text-2xl font-bold text-primary rupee-display">
                ₹{loanRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold block">
                @ ₹{pledge.monthlyVattiRate}/mo Vatti
              </span>
            </div>
          </div>

          {/* Customer & Collateral Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t text-xs">
            {/* Customer Details */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-1.5">
              <span className="font-bold text-muted-foreground uppercase text-[10px] block">Customer Details</span>
              <p className="font-bold text-sm text-foreground">{pledge.customerName}</p>
              <p className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {pledge.customerPhone}
              </p>
              {pledge.customerAadhaar && (
                <p className="text-muted-foreground">Aadhaar: {pledge.customerAadhaar}</p>
              )}
              {pledge.customerAddress && (
                <p className="text-muted-foreground">Address: {pledge.customerAddress}</p>
              )}
            </div>

            {/* Collateral Specs */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-1.5">
              <span className="font-bold text-amber-900 dark:text-amber-200 uppercase text-[10px] block">
                Collateral & Scale Weight (எடை)
              </span>
              <div className="flex justify-between items-center">
                <span>Purity / Karat:</span>
                <span className="font-bold">{pledge.purityKarat}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Gross Weight:</span>
                <span className="font-semibold">{pledge.grossWeightGrams} g</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Stone Deduction:</span>
                <span>{pledge.stoneWeightGrams} g</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t font-bold text-amber-800 dark:text-amber-300 text-sm">
                <span>Net Weight:</span>
                <span>{pledge.netWeightGrams} g ({pavan} Pavan)</span>
              </div>
            </div>
          </div>

          {/* Scale Photo Gallery (Up to 5 Photos) */}
          {pledge.images && pledge.images.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="font-bold text-muted-foreground uppercase text-[10px] block">
                Item & Weighing Scale Photos ({pledge.images.length} Photos)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {pledge.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhoto(img.url)}
                    className="relative group rounded-lg overflow-hidden border aspect-square cursor-pointer hover:opacity-90 transition-opacity bg-black/5"
                  >
                    <img src={img.url} alt={`Scale photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Maximize2 className="h-5 w-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Vatti & Redemption Breakdown */}
      {!isRedeemed && (
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Live Accrued Vatti & Redemption Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {isVattiLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-background rounded-lg border">
                  <span className="text-muted-foreground block">Period Elapsed</span>
                  <span className="font-bold text-sm text-foreground">
                    {vattiData?.days || 0} days ({vattiData?.months || 0} mo)
                  </span>
                </div>

                <div className="p-2.5 bg-background rounded-lg border">
                  <span className="text-muted-foreground block">Gross Accrued Vatti</span>
                  <span className="font-bold text-sm text-purple-600 rupee-display">
                    ₹{((vattiData?.grossInterestPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-2.5 bg-background rounded-lg border">
                  <span className="text-muted-foreground block">Interest Paid So Far</span>
                  <span className="font-bold text-sm text-success rupee-display">
                    ₹{((vattiData?.totalInterestPaidPaise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-2.5 bg-purple-600 text-white rounded-lg shadow-xs">
                  <span className="text-purple-100 block text-[10px] font-semibold">Total to Redeem Item</span>
                  <span className="font-bold text-sm sm:text-base rupee-display">
                    ₹{totalRedemptionRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction & Receipt History */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Interest & Repayment Receipts ({payments.length})</h3>

        {payments.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-xs border-dashed">
            No payments recorded yet on this pledge.
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const dateStr = new Date(p.date).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <Card key={p._id} className="p-3.5 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={p.type === "FULL_REDEMPTION" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {p.type === "FULL_REDEMPTION"
                            ? "Collateral Redeemed"
                            : p.type === "INTEREST_ONLY"
                            ? "Vatti Interest Paid"
                            : "Principal Reduced"}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {p.receiptNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {dateStr} • Mode: {p.paymentMethod.toUpperCase()}{" "}
                        {p.notes ? `• ${p.notes}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm rupee-display text-success">
                        ₹{(p.totalPaidPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          generateAdakuPaymentReceiptPDF(p, pledge, {
                            name: user?.name || "Vetrinel Traders",
                            phone: user?.phone || "",
                          })
                        }
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Zoom Modal */}
      {activePhoto && (
        <Dialog open={!!activePhoto} onOpenChange={() => setActivePhoto(null)}>
          <DialogContent className="max-w-2xl p-2 bg-black/90 border-none">
            <div className="relative aspect-auto max-h-[80vh] flex items-center justify-center overflow-hidden rounded-lg">
              <img src={activePhoto} alt="Zoomed scale photo" className="max-h-[75vh] w-auto object-contain rounded" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
