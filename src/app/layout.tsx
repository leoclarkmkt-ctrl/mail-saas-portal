import type { ReactNode } from "react";
import { Inter, Open_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LanguageSwitch } from "@/components/language-switch";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary, getLocale } from "@/i18n";
import { withLang } from "@/lib/i18n/shared";

export const metadata = {
  title: "NSUK Mail Portal",
  description: "NSUK official mail portal",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }]
  }
};

const headingFont = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const bodyFont = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const locale = getLocale();
  const dict = getDictionary(locale);
  return (
    <html lang={locale} className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        <div className="min-h-screen bg-surface text-slate-900">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">{dict.common.portal}</p>
                <h1 className="text-lg font-semibold text-primary">{dict.common.brand}</h1>
                <p className="text-sm text-slate-500">{dict.common.brandZh}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <Link className="hover:text-slate-900" href={withLang("/admin/login", locale)}>
                  {dict.common.admin}
                </Link>
                <LanguageSwitch currentLang={locale} />
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
