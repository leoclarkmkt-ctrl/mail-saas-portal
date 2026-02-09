import Link from "next/link";
import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { withLang } from "@/lib/i18n/shared";
import { Button } from "@/components/ui/button";
import { HeroParticlesCanvas } from "@/components/hero-particles-canvas";

export default function HomePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm min-h-[360px] flex flex-col justify-center">
      <HeroParticlesCanvas fadeDistance={320} />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15, 23, 42, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(15, 23, 42, 0.12) 0.5px, transparent 0.6px), radial-gradient(rgba(15, 23, 42, 0.12) 0.5px, transparent 0.6px)",
            backgroundPosition: "0 0, 12px 12px",
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      <div className="relative z-10 px-10 py-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold text-slate-900">National Science University of Kyrgyzstan</h1>
          <h2 className="mt-3 text-2xl font-medium text-primary">NSUK 官方邮箱门户</h2>
          <p className="mt-4 text-base text-slate-600">
            面向学生与科研人员的安全、稳定、国际化教育邮箱服务。用于学术交流、系统通知与身份验证。
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Secure academic email service for students and researchers.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Link href={withLang("/redeem", lang)}>
            <Button className="w-full" size="lg">
              {dict.home.redeem}
            </Button>
          </Link>
          <Link href={withLang("/edu-mail/login", lang)}>
            <Button className="w-full" size="lg" variant="outline">
              {dict.home.webmail}
            </Button>
          </Link>
          <Link href={withLang("/dashboard", lang)}>
            <Button className="w-full" size="lg" variant="outline">
              {dict.home.dashboard}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
