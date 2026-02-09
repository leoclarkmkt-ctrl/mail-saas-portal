import { getDictionary } from "@/i18n";
import { getLocaleFromCookies } from "@/lib/i18n/server";
import { DashboardPanel } from "@/components/dashboard-panel";
import { requirePersonalDashboardData } from "@/lib/dashboard/require-personal-dashboard-data";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = getLocaleFromCookies();
  const dict = await getDictionary(lang);

  const data = await requirePersonalDashboardData();
  const formatExpiresAt = (value: string, locale: string) => {
    const formatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
    return `${formatter.format(new Date(value))} (UTC)`;
  };
  const expiresAtDisplay = data.expiresAtIso
    ? formatExpiresAt(data.expiresAtIso, lang)
    : "--";

  // edu=expired → 首次加载自动弹出“教育邮箱已过期”弹窗
  const eduParam =
    typeof searchParams?.edu === "string"
      ? searchParams.edu
      : Array.isArray(searchParams?.edu)
      ? searchParams.edu[0]
      : undefined;

  const showEduExpiredOnLoad = eduParam === "expired";

  return (
    <DashboardPanel
      data={{
        personalEmail: data.personalEmail,
        eduEmail: data.eduEmail,
        expiresAt: expiresAtDisplay,
        status: data.status,
        suspended: data.suspended,
        expired: data.expired,
      }}
      lang={lang}
      showEduExpiredOnLoad={showEduExpiredOnLoad}
      labels={{
        personalEmail: dict.dashboard.personalEmail,
        eduEmail: dict.dashboard.eduEmail,
        status: dict.dashboard.status,
        expiresAt: dict.dashboard.expiresAt,
        webmail: dict.dashboard.webmail,
        logout: dict.dashboard.logout,

        changePassword: dict.dashboard.changePassword,
        passwordHint: dict.dashboard.passwordHint,
        oldPassword: dict.dashboard.oldPassword,
        newPassword: dict.dashboard.newPassword,
        submit: dict.common.submit,
        passwordUpdated: dict.dashboard.passwordUpdated,

        renew: dict.dashboard.renew,
        renewHint: dict.dashboard.renewHint,
        activationCode: dict.redeem.activationCode,
        renewSubmit: dict.dashboard.renewSubmit,
        renewSuccess: dict.dashboard.renewSuccess,

        suspended: dict.dashboard.suspended,
        expiredNotice: dict.dashboard.expiredNotice,
        renewEnableFailed: dict.dashboard.renewEnableFailed,

        errorFallback: dict.dashboard.errorFallback,
        errorMessages: dict.dashboard.errorMessages,

        eduMailExpiredTitle: dict.dashboard.eduMailExpiredTitle,
        eduMailExpiredBody: dict.dashboard.eduMailExpiredBody,

        // 如果你 common 里还没有 ok，就先用 submit 顶一下，保证编译过
        // 建议后续在 i18n/en.ts 和 i18n/zh.ts 给 common 加一个 ok: "OK"/"确定"
        ok: (dict.common as any).ok ?? dict.common.submit,
      }}
    />
  );
}
