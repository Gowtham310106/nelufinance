// src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next & _vercel (Next.js internals)
  // - Static files (e.g. /favicon.ico, /manifest.webmanifest, *.svg)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
