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
    <section className="relative overflow-hidden rounded-3xl bg-white p-10 shadow-sm">
      <HeroParticlesCanvas fadeDistance={320} />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/90 via-white/75 to-white/70" />
      <div className="relative z-10">
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
