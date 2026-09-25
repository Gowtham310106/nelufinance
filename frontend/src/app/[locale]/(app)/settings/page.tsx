// src/app/[locale]/(app)/settings/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSeed } from "@/features/seed/hooks/use-seed";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Languages,
  Store,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Settings as SettingsIcon,
} from "lucide-react";

interface BusinessSettings {
  defaultUnit?: "kg" | "quintal" | "tonne" | "bag";
  lowStockThresholdKg?: number;
  allowNegativeStock?: boolean;
}

interface Business {
  _id: string;
  name: string;
  nameTamil?: string;
  address?: string;
  phone: string;
  gstNumber?: string;
  settings?: BusinessSettings;
  updatedAt?: string;
}

interface BusinessForm {
  name: string;
  nameTamil: string;
  phone: string;
  address: string;
  gstNumber: string;
  lowStockThresholdKg: string;
  allowNegativeStock: boolean;
}

function toForm(b: Business): BusinessForm {
  return {
    name: b.name || "",
    nameTamil: b.nameTamil || "",
    phone: b.phone || "",
    address: b.address || "",
    gstNumber: b.gstNumber || "",
    lowStockThresholdKg: String(b.settings?.lowStockThresholdKg ?? ""),
    allowNegativeStock: !!b.settings?.allowNegativeStock,
  };
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { populateDemo } = useSeed();

  const isOwner = user?.role === "owner";
  const businessId = user?.businessId;

  const businessQuery = useQuery({
    queryKey: ["business", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Business }>(`/business/${businessId}`);
      return res.data;
    },
  });
  const business = businessQuery.data;

  // Form state, (re)initialised whenever a new version of the business is loaded
  const [form, setForm] = useState<BusinessForm | null>(null);
  const [loadedVersion, setLoadedVersion] = useState<string | null>(null);
  const businessVersion = business ? `${business._id}:${business.updatedAt ?? ""}` : null;
  if (business && businessVersion !== loadedVersion) {
    setLoadedVersion(businessVersion);
    setForm(toForm(business));
  }

  const [formError, setFormError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateBusiness = useMutation({
    mutationFn: async (f: BusinessForm) => {
      const threshold = parseFloat(f.lowStockThresholdKg);
      const res = await api.put<{ success: boolean; data: Business }>(`/business/${businessId}`, {
        name: f.name.trim(),
        nameTamil: f.nameTamil.trim(),
        phone: f.phone.trim(),
        address: f.address.trim(),
        gstNumber: f.gstNumber.trim(),
        settings: {
          allowNegativeStock: f.allowNegativeStock,
          ...(Number.isFinite(threshold) && threshold >= 0 ? { lowStockThresholdKg: threshold } : {}),
        },
      });
      return res.data;
    },
    onSuccess: (updated) => {
      if (updated) queryClient.setQueryData(["business", businessId], updated);
      queryClient.invalidateQueries({ queryKey: ["business"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const setField = <K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setFormError("");
    setSaveSuccess(false);

    if (!form.name.trim()) {
      setFormError(`${t("settings.businessName")}: ${t("validation.required")}`);
      return;
    }
    if (!/^[+]?[0-9]{10,13}$/.test(form.phone.trim())) {
      setFormError(t("validation.invalidPhone"));
      return;
    }

    try {
      await updateBusiness.mutateAsync(form);
      setSaveSuccess(true);
    } catch (err) {
      setFormError(errorMessage(err, t("common.error")));
    }
  };

  const [seedSuccess, setSeedSuccess] = useState(false);
  const [seedError, setSeedError] = useState("");

  const switchLanguage = (newLocale: "en" | "ta") => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleLoadDemo = async () => {
    setSeedError("");
    if (!window.confirm(t("settings.demoDataConfirm"))) return;
    try {
      await populateDemo.mutateAsync();
      setSeedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setSeedError(errorMessage(err, t("common.error")));
    }
  };

  const readOnly = !isOwner;
  const inputClass = readOnly ? "bg-muted/40" : "";

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          {t("nav.settings")} (அமைப்புகள்)
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage system language, shop profile, and default configurations
        </p>
      </div>

      {/* 1. Language Preference */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            Language Preference (மொழி தேர்வு)
          </CardTitle>
          <CardDescription className="text-xs">
            Switch between English and தமிழ் (Tamil) for all invoices, reports, and UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <Button
              type="button"
              variant={locale === "en" ? "default" : "outline"}
              onClick={() => switchLanguage("en")}
              className="h-12 flex flex-col items-center justify-center font-bold text-sm"
            >
              <span>English</span>
              <span className="text-[10px] opacity-80">Default</span>
            </Button>

            <Button
              type="button"
              variant={locale === "ta" ? "default" : "outline"}
              onClick={() => switchLanguage("ta")}
              className="h-12 flex flex-col items-center justify-center font-bold text-sm"
            >
              <span>தமிழ்</span>
              <span className="text-[10px] opacity-80">Tamil</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Shop Profile */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Store className="h-4 w-4 text-amber-600" />
            {t("settings.businessInfo")} (கடை விவரம்)
          </CardTitle>
          {readOnly && (
            <CardDescription className="text-xs">{t("settings.ownerOnly")}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          {!businessId ? (
            <p className="text-xs text-muted-foreground">{t("common.noData")}</p>
          ) : businessQuery.isLoading || (!form && !businessQuery.isError) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : businessQuery.isError || !form ? (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex flex-wrap items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                {t("common.loadError")}
                {businessQuery.error instanceof Error ? ` — ${businessQuery.error.message}` : ""}
              </span>
              <Button size="sm" variant="outline" onClick={() => businessQuery.refetch()}>
                {t("common.retry")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              {formError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{t("settings.saved")}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="biz-name" className="text-xs font-semibold">
                    {t("settings.businessName")}
                  </Label>
                  <Input
                    id="biz-name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    readOnly={readOnly}
                    className={inputClass}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="biz-name-ta" className="text-xs font-semibold">
                    {t("settings.businessNameTamil")}
                  </Label>
                  <Input
                    id="biz-name-ta"
                    value={form.nameTamil}
                    onChange={(e) => setField("nameTamil", e.target.value)}
                    readOnly={readOnly}
                    className={inputClass}
                    maxLength={200}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="biz-phone" className="text-xs font-semibold">
                    {t("common.phone")}
                  </Label>
                  <Input
                    id="biz-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    readOnly={readOnly}
                    className={inputClass}
                    maxLength={13}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="biz-gst" className="text-xs font-semibold">
                    {t("settings.gstNumber")}
                  </Label>
                  <Input
                    id="biz-gst"
                    value={form.gstNumber}
                    onChange={(e) => setField("gstNumber", e.target.value)}
                    readOnly={readOnly}
                    className={inputClass}
                    maxLength={20}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="biz-address" className="text-xs font-semibold">
                    {t("common.address")}
                  </Label>
                  <Input
                    id="biz-address"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    readOnly={readOnly}
                    className={inputClass}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="biz-low-stock" className="text-xs font-semibold">
                    {t("settings.lowStockThreshold")} (kg)
                  </Label>
                  <Input
                    id="biz-low-stock"
                    type="number"
                    min="0"
                    step="any"
                    value={form.lowStockThresholdKg}
                    onChange={(e) => setField("lowStockThresholdKg", e.target.value)}
                    readOnly={readOnly}
                    className={inputClass}
                  />
                </div>

                <label className="flex items-center gap-2 self-end h-9 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowNegativeStock}
                    onChange={(e) => setField("allowNegativeStock", e.target.checked)}
                    disabled={readOnly}
                    className="h-4 w-4 accent-primary"
                  />
                  {t("settings.allowNegativeStock")}
                </label>
              </div>

              {isOwner && (
                <Button type="submit" className="gap-1.5" disabled={updateBusiness.isPending}>
                  {updateBusiness.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t("settings.saveChanges")}
                </Button>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      {/* 3. Demo Data Seeder (owner only; backend refuses once the business has transactions) */}
      {isOwner && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              1-Click Demo Shop Data
            </CardTitle>
            <CardDescription className="text-xs">
              Populates sample Tamil Nadu rice varieties, mandi vendors, hotel customers, lorry weighbridge tickets, and daily closing.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {seedError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{seedError}</span>
              </div>
            )}
            <Button
              onClick={handleLoadDemo}
              disabled={populateDemo.isPending || seedSuccess}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 h-9"
            >
              {populateDemo.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Populating Data...
                </>
              ) : seedSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("settings.demoDataLoaded")}
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("settings.loadDemoData")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
