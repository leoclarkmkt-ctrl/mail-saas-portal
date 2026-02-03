import { getDictionary } from "@/i18n";

export function SiteFooter() {
  const dict = getDictionary();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-600">
        <p>{dict.footer.description}</p>
        <p className="text-slate-500">{dict.footer.copyright}</p>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-slate-400">{dict.footer.follow}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {dict.footer.platforms.map((platform) => (
              <span key={platform}>{platform}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
