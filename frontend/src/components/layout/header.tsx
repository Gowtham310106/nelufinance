// src/components/layout/header.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, User, LogOut, Store } from "lucide-react";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const switchLocale = () => {
    const newLocale = locale === "en" ? "ta" : "en";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 gap-2">
        {/* Brand / Greeting */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="md:hidden w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            <Store className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
              {user?.name ? `${user.name}` : t("common.appName")}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block -mt-0.5">
              {t("common.tagline")}
            </p>
          </div>
        </div>

        {/* Right Actions: Language Switcher & Profile Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Prominent Language Switcher Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={switchLocale}
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/10 text-primary transition-all active:scale-95"
            aria-label="Switch language between Tamil and English"
          >
            <Languages className="h-3.5 w-3.5" />
            <span>{locale === "en" ? "தமிழ்" : "English"}</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 border shrink-0 cursor-pointer bg-muted/40">
              <User className="h-4 w-4 text-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs">
                <p className="font-bold truncate text-foreground">{user?.name || "Trader"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.phone || ""}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={switchLocale} className="cursor-pointer text-xs">
                <Languages className="mr-2 h-3.5 w-3.5 text-primary" />
                <span>Switch to {locale === "en" ? "தமிழ் (Tamil)" : "English"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer text-xs">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                {t("auth.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
