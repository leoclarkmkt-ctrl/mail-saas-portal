import Link from "next/link";
import { getDictionary } from "@/i18n";
import { getLangFromRequest, withLang } from "@/lib/i18n";
import { EduMailLoginForm } from "@/components/edu-mail-login-form";

export default function EduMailLoginPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);

  return (
    <section className="relative overflow-hidden">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Education Mail
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-primary">Sign in to your student mailbox</h2>
          <p className="mt-3 text-sm text-slate-500">
            Secure access to your NSUK education inbox with your portal credentials.
          </p>

          <div className="mt-8">
            <EduMailLoginForm errors={dict.errors} lang={lang} />
          </div>

          <p className="mt-6 text-xs text-slate-400">
            By signing in you agree to the campus email usage policy.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-primary text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,212,255,0.2),_transparent_60%)]" />
          <div className="particle-field absolute inset-0 opacity-60" />
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[#00d4ff]/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-8 h-72 w-72 rounded-full bg-[#00ff9f]/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-neon">NSUK Edu Mail</p>
              <h3 className="text-3xl font-semibold leading-tight">
                A modern inbox built for next-generation campus workflows.
              </h3>
              <p className="text-sm text-white/70">
                Stay connected with faculty announcements, class updates, and secure student communications
                from one intelligent portal.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold text-white">Need a new mailbox?</p>
              <p className="mt-2 text-sm text-white/70">
                Claim your education email and manage renewals in the student dashboard.
              </p>
              <Link
                className="mt-4 inline-flex text-sm font-semibold text-accent hover:text-neon"
                href={withLang("/redeem", lang)}
              >
                Activate your edu account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
