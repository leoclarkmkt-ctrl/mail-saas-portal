import type { ReactNode } from "react";
import "./globals.css";
import Link from "next/link";
import { LanguageSwitch } from "@/components/language-switch";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/i18n";
import { withLang } from "@/lib/i18n";

export const metadata = {
  title: "NSUK Mail Portal",
  description: "NSUK official mail portal",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const dict = getDictionary();
  return (
    <html lang={dict.locale}>
      <body>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">{dict.common.portal}</p>
                <h1 className="text-lg font-semibold text-primary">{dict.common.brand}</h1>
                <p className="text-sm text-slate-500">{dict.common.brandZh}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <Link className="hover:text-slate-900" href={withLang("/admin/login", dict.locale)}>
                  {dict.common.admin}
                </Link>
              <div className="flex items-center gap-2">
                <LanguageSwitch />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
