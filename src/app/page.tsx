import Link from "next/link";
import { getDictionary } from "@/i18n";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const dict = getDictionary();
  return (
    <section className="relative overflow-hidden rounded-3xl bg-white p-10 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary">{dict.home.title}</h2>
          <p className="mt-3 max-w-xl text-slate-600">{dict.home.subtitle}</p>
        </div>
        <Link className="text-xs text-slate-400 hover:text-primary" href="/admin/login">
          {dict.home.adminHint}
        </Link>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Link href="/redeem">
          <Button className="w-full" size="lg">
            {dict.home.redeem}
          </Button>
        </Link>
        <a href="https://mail.nsuk.edu.kg/" target="_blank" rel="noreferrer">
          <Button className="w-full" size="lg" variant="outline">
            {dict.home.webmail}
          </Button>
        </a>
        <Link href="/dashboard">
          <Button className="w-full" size="lg" variant="ghost">
            {dict.home.dashboard}
          </Button>
        </Link>
      </div>
    </section>
  );
}
