// src/app/layout.tsx
// Pass-through root layout (next-intl pattern): the real root layout that renders
// <html>/<body> lives in [locale]/layout.tsx so `lang` can follow the locale.
// This file is still required because app/not-found.tsx sits at the root level;
// that page therefore renders its own <html>/<body>.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
