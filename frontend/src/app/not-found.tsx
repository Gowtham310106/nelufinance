// src/app/not-found.tsx
// Fallback 404 for requests outside a locale segment (the middleware normally
// prefixes every path with a locale, so this is rarely reached). The root layout
// is a pass-through, so this page must provide <html> and <body> itself.
import Link from "next/link";
import "./globals.css";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-sm text-muted-foreground">Page not found · பக்கம் கிடைக்கவில்லை</p>
          {/* Crossing into the [locale] root layout triggers a full page load automatically */}
          <Link href="/en/dashboard" className="inline-block text-sm font-medium text-primary underline">
            Go to Dashboard
          </Link>
        </div>
      </body>
    </html>
  );
}
