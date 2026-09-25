// src/app/[locale]/[...rest]/page.tsx
// Catch-all for unknown paths under a locale so they render the localized
// [locale]/not-found.tsx inside the locale layout (next-intl recommended pattern).
import { notFound } from "next/navigation";

export default function CatchAllPage() {
  notFound();
}
