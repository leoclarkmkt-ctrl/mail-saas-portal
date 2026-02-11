import type { ReactNode } from "react";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { LanguageSwitch } from "@/components/language-switch";
import { SiteFooter } from "@/components/site-footer";
import { getLocaleFromCookies, getPortalDictionary } from "@/lib/i18n/server";
import { withLang } from "@/lib/i18n/shared";

export const metadata = {
  title: "NSUK Mail Portal",
  description: "NSUK official mail portal",
  icons: {
    icon: [{ url: "/logo3.png", type: "image/png" }]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const locale = getLocaleFromCookies();
  const dict = getPortalDictionary(locale);

  return (
    <html lang={locale}>
      <body>
        <div className="min-h-screen bg-surface text-slate-900">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  alt={`${dict.common.brand} logo`}
                  className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
                  height={40}
                  width={40}
                  src="/logo128.png"
                />
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold leading-tight text-primary">
                    {dict.common.brand}
                  </h1>
                  <p className="text-sm leading-tight text-slate-500">{dict.common.brandZh}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600">
                <Link className="hover:text-slate-900" href={withLang("/admin/login", locale)}>
                  {dict.common.admin}
                </Link>
                <LanguageSwitch
                  currentLang={locale}
                  labels={{
                    switchToEn: dict.common.switchToEn,
                    switchToZh: dict.common.switchToZh
                  }}
                />
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
