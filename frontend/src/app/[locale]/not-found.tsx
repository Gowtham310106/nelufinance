// src/app/[locale]/not-found.tsx
// Rendered inside [locale]/layout.tsx for notFound() calls and unknown paths
// (see [locale]/[...rest]/page.tsx), so translations and styles are available.
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function LocaleNotFound() {
  const t = useTranslations();

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-sm">
        <p className="text-5xl font-bold text-primary">404</p>
        <h1 className="text-xl font-semibold">{t("common.notFoundTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("common.notFoundDescription")}</p>
        <Link href="/dashboard">
          <Button className="mt-2">{t("common.goToDashboard")}</Button>
        </Link>
      </div>
    </main>
  );
}
