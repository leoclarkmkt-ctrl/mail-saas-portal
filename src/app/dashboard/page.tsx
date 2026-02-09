import { getDictionary } from "@/i18n";
import { getLocale } from "@/lib/i18n/server";
import { DashboardPanel } from "@/components/dashboard-panel";
import { requirePersonalDashboardData } from "@/lib/dashboard/require-personal-dashboard-data";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = await getLocale();
  const dict = await getDictionary(lang);

  const data = await requirePersonalDashboardData();

  const eduParam = typeof searchParams?.edu === "string" ? searchParams.edu : undefined;
  const showEduExpiredOnLoad = eduParam === "expired";

  return (
    <DashboardPanel
      data={data}
      lang={lang}
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
        ok: dict.common.submit, // 或者 dict.common.ok（如果你有）
      }}
      showEduExpiredOnLoad={showEduExpiredOnLoad}
    />
  );
}
