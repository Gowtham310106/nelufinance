// src/app/[locale]/(app)/settings/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSeed } from "@/features/seed/hooks/use-seed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Languages,
  Store,
  Phone,
  Sparkles,
  Loader2,
  CheckCircle2,
  Settings as SettingsIcon,
  Coins,
  Scale,
} from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { populateDemo } = useSeed();

  const [seedSuccess, setSeedSuccess] = useState(false);

  const switchLanguage = (newLocale: "en" | "ta") => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleLoadDemo = async () => {
    try {
      await populateDemo.mutateAsync();
      setSeedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

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
            Shop Details (கடை விவரம்)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Shop Name</Label>
              <Input defaultValue={user?.name || "Vetrinel Rice Traders"} readOnly className="bg-muted/40" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Registered Phone</Label>
              <Input defaultValue={user?.phone || ""} readOnly className="bg-muted/40" />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-semibold">Location / State</Label>
              <Input defaultValue="Tamil Nadu, India" readOnly className="bg-muted/40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Demo Data Seeder */}
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
        <CardContent className="p-4 pt-2">
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
                Demo Data Loaded! Redirecting...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Load Realistic Demo Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
