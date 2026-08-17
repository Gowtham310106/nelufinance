// src/app/[locale]/(app)/adaku/new/page.tsx
"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Coins,
  Camera,
  Upload,
  Trash2,
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Scale,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api-client";

const RATE_PRESETS = [1.0, 1.5, 2.0, 2.5, 3.0];

export default function NewAdakuPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { customers } = useCustomers();

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAadhaar, setCustomerAadhaar] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [itemType, setItemType] = useState<"gold" | "silver" | "brass_metal" | "other">("gold");
  const [purityKarat, setPurityKarat] = useState("22K (916 KDM)");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCount, setItemCount] = useState("1");
  const [grossWeight, setGrossWeight] = useState("");
  const [stoneWeight, setStoneWeight] = useState("0");
  const [loanAmountRupees, setLoanAmountRupees] = useState("");
  const [monthlyVattiRate, setMonthlyVattiRate] = useState<number>(2.0);
  const [lockerNumber, setLockerNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Photo Gallery State (up to 5 photos)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Weight Calculations
  const gross = parseFloat(grossWeight || "0");
  const stone = parseFloat(stoneWeight || "0");
  const netGrams = Math.max(0, gross - stone);
  const netPavan = (netGrams / 8).toFixed(2); // 1 Pavan = 8 grams in Tamil Nadu

  const handleCustomerSelect = (custId: string) => {
    const cust = customers.find((c) => c._id === custId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone);
      if (cust.address) setCustomerAddress(cust.address);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArr = Array.from(e.target.files);

    const totalAllowed = 5 - selectedFiles.length;
    const filesToAdd = filesArr.slice(0, totalAllowed);

    const newFiles = [...selectedFiles, ...filesToAdd];
    setSelectedFiles(newFiles);

    // Create object URLs for instant preview
    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setPreviewUrls(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim() || !customerPhone.trim() || !itemDescription.trim() || gross <= 0) {
      setError("Please fill all required customer and collateral weight details");
      return;
    }

    const loanAmt = parseFloat(loanAmountRupees);
    if (!loanAmt || loanAmt <= 0) {
      setError("Please enter a valid loan principal amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAadhaar: customerAadhaar.trim(),
        customerAddress: customerAddress.trim(),
        itemType,
        purityKarat,
        itemDescription: itemDescription.trim(),
        itemCount: parseInt(itemCount || "1", 10),
        grossWeightGrams: gross,
        stoneWeightGrams: stone,
        netWeightGrams: netGrams,
        loanAmountPaise: Math.round(loanAmt * 100),
        monthlyVattiRate,
        lockerNumber: lockerNumber.trim(),
        notes: notes.trim(),
      };

      formData.append("data", JSON.stringify(payload));

      // Append image files
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const token = typeof window !== "undefined" ? localStorage.getItem("vetrinel_token") : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/adaku`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to create pledge ticket");
      }

      router.push(`/adaku/${data.data._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to record pledge loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <Badge variant="outline" className="font-mono text-xs">
          Pledge Entry Form
        </Badge>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            New Adaku Pledge Loan (புதிய அடகு சீட்டு)
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Customer Details */}
            <div className="space-y-3 p-3.5 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Customer Details (வாடிக்கையாளர் விவரம்)
                </h4>
                {customers.length > 0 && (
                  <Select onValueChange={(val) => { if (typeof val === "string") handleCustomerSelect(val); }}>
                    <SelectTrigger className="w-44 h-7 text-xs bg-background">
                      <SelectValue placeholder="Pick Existing" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name} ({c.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="c-name" className="text-xs font-semibold">Customer Name *</Label>
                  <Input
                    id="c-name"
                    placeholder="Full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="c-phone" className="text-xs font-semibold">Phone Number *</Label>
                  <Input
                    id="c-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="c-aadhaar" className="text-xs">Aadhaar / ID Proof</Label>
                  <Input
                    id="c-aadhaar"
                    placeholder="Aadhaar # (e.g. 1234 5678 9012)"
                    value={customerAadhaar}
                    onChange={(e) => setCustomerAadhaar(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="c-address" className="text-xs">Village / Town Address</Label>
                  <Input
                    id="c-address"
                    placeholder="Address / Street"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Collateral & Weight Verification */}
            <div className="space-y-3 p-3.5 rounded-lg border bg-amber-500/5 border-amber-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" />
                2. Collateral Specifications & Scale Weights (பொருள் & எடை)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Collateral Type *</Label>
                  <Select
                    value={itemType}
                    onValueChange={(val) => val && setItemType(val as any)}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">Gold (தங்கம்)</SelectItem>
                      <SelectItem value="silver">Silver (வெள்ளி)</SelectItem>
                      <SelectItem value="brass_metal">Brass / Metal (பித்தளை/பாத்திரம்)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Purity / Karat</Label>
                  <Select value={purityKarat} onValueChange={(val) => val && setPurityKarat(val)}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22K (916 KDM)">22K (916 KDM)</SelectItem>
                      <SelectItem value="20K">20K (83.3%)</SelectItem>
                      <SelectItem value="18K">18K (75.0%)</SelectItem>
                      <SelectItem value="Silver 92.5">Silver 92.5</SelectItem>
                      <SelectItem value="Silver Local">Silver Local</SelectItem>
                      <SelectItem value="Brass/Copper">Brass / Copper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="item-count" className="text-xs">No. of Items</Label>
                  <Input
                    id="item-count"
                    type="number"
                    min="1"
                    value={itemCount}
                    onChange={(e) => setItemCount(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="item-desc" className="text-xs font-semibold">
                  Item Description (பொருள் பெயர் & விவரம்) *
                </Label>
                <Input
                  id="item-desc"
                  placeholder="e.g. 1 Gold Chain with Dollar / மோதிரம் / தோடு"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="bg-background font-medium"
                  required
                />
              </div>

              {/* Weight Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="gross-wt" className="text-xs font-semibold">Gross Weight (மொத்த எடை) g *</Label>
                  <Input
                    id="gross-wt"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 24.50"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="bg-background font-bold text-base"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="stone-wt" className="text-xs">Stone / Wastage (கல் கழிவு) g</Label>
                  <Input
                    id="stone-wt"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={stoneWeight}
                    onChange={(e) => setStoneWeight(e.target.value)}
                    className="bg-background font-medium text-base"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col justify-center text-center">
                  <span className="text-[10px] text-amber-900 dark:text-amber-200 font-semibold block">
                    Net Weight (சுத்த எடை)
                  </span>
                  <span className="text-base font-bold text-amber-700 dark:text-amber-300">
                    {netGrams.toFixed(2)} g
                  </span>
                  <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    = {netPavan} Pavan (பவுன்)
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Camera Capture & Photo Verification */}
            <div className="space-y-3 p-3.5 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    3. Item & Weighing Scale Photos (எடை இயந்திர புகைப்படம்)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Take photos of the gold item placed on the digital scale ({selectedFiles.length}/5 photos)
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedFiles.length >= 5}
                  className="gap-1.5 text-xs h-8"
                >
                  <Camera className="h-3.5 w-3.5 text-primary" />
                  Take Photo / Upload
                </Button>
              </div>

              {/* Photo Preview Grid */}
              {previewUrls.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-2">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border aspect-square bg-black/5">
                      <img src={url} alt={`Scale photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">
                        Photo {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-lg border border-dashed text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold">Tap to capture or upload up to 5 photos</p>
                    <p className="text-[10px] text-muted-foreground">
                      Photos are auto-compressed via Sharp for crystal-clear scale digit legibility
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Loan & Vatti Rate Terms */}
            <div className="space-y-3 p-3.5 rounded-lg border bg-purple-500/5 border-purple-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5" />
                4. Loan Principal & Monthly Vatti (கடன் தொகை & வட்டி)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="loan-amt" className="text-xs font-semibold">Loan Principal Amount (கடன் தொகை) (₹) *</Label>
                  <Input
                    id="loan-amt"
                    type="number"
                    step="any"
                    placeholder="e.g. 50000"
                    value={loanAmountRupees}
                    onChange={(e) => setLoanAmountRupees(e.target.value)}
                    className="h-11 text-lg font-bold text-primary bg-background"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Monthly Vatti Rate (மாத வட்டி விகிதம்)</Label>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {RATE_PRESETS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setMonthlyVattiRate(r)}
                        className={`px-2.5 py-2 text-xs rounded-lg font-bold border transition-colors ${
                          monthlyVattiRate === r
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        ₹{r.toFixed(1)} வட்டி
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="safe-box" className="text-xs flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Safe Locker / Box No
                  </Label>
                  <Input
                    id="safe-box"
                    placeholder="e.g. Locker Box A-12"
                    value={lockerNumber}
                    onChange={(e) => setLockerNumber(e.target.value)}
                    className="bg-background text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="p-notes" className="text-xs">Notes / Remarks</Label>
                  <Input
                    id="p-notes"
                    placeholder="Optional remarks"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-background text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Compressing Photos & Saving Pledge...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Create Adaku Pledge & Generate Ticket
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
