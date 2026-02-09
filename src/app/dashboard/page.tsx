import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { getLangFromRequest } from "@/lib/i18n/server";
import { withLang } from "@/lib/i18n/shared";
import { getUserSession, clearUserSession } from "@/lib/auth/user-session";
import { getUserWithEdu } from "@/lib/data/user";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import { DashboardPanel } from "@/components/dashboard-panel";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = getLangFromRequest(searchParams);
  const dict = getDictionary(lang);

  const session = await getUserSession();
  if (!session) {
    redirect(withLang("/login", lang));
  }

  const data = await getUserWithEdu(session.userId);
  if (!data?.edu_accounts?.[0]) {
    clearUserSession();
    redirect(withLang("/login", lang));
  }

  const edu = data.edu_accounts[0];
  const expired = new Date(edu.expires_at) <= new Date();

  if (expired && edu.status !== "expired") {
    const supabase = createServerSupabaseClient();
    await supabase.from("edu_accounts").update({ status: "expired" }).eq("id", edu.id);
  }

  if (data.is_suspended) {
    clearUserSession();
    redirect(withLang("/login?reason=suspended", lang));
  }

  const statusLabel = data.is_suspended
    ? dict.dashboard.suspended
    : expired
    ? dict.dashboard.expired
    : dict.dashboard.active;

  const eduExpiredFlag =
    typeof searchParams?.edu === "string"
      ? searchParams.edu
      : Array.isArray(searchParams?.edu)
      ? searchParams?.edu?.[0]
      : undefined;
  const showEduExpiredOnLoad = eduExpiredFlag === "expired";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">{dict.dashboard.title}</h2>

      <DashboardPanel
        data={{
          personalEmail: data.personal_email,
          eduEmail: edu.edu_email,
          expiresAt: formatDate(edu.expires_at),
          status: statusLabel,
          suspended: data.is_suspended,
          expired,
        }}
        labels={{
          personalEmail: dict.dashboard.personalEmail,
          eduEmail: dict.dashboard.eduEmail,
          status: dict.dashboard.status,
          expiresAt: dict.dashboard.expiresAt,
          webmail: dict.dashboard.webmail,

          // ✅ 正式使用 logout
          logout: dict.dashboard.logout,

          changePassword: dict.dashboard.changePassword,
          oldPassword: dict.dashboard.oldPassword,
          newPassword: dict.dashboard.newPassword,
          submit: dict.common.submit,

          renew: dict.dashboard.renew,
          renewSubmit: dict.dashboard.renewSubmit,
          renewSuccess: dict.dashboard.renewSuccess,
          activationCode: dict.redeem.activationCode,

          suspended: dict.dashboard.suspended,
          passwordHint: dict.dashboard.passwordHint,
          passwordUpdated: dict.dashboard.passwordUpdated,
          renewHint: dict.dashboard.renewHint,
          expiredNotice: dict.dashboard.expiredNotice,
          renewEnableFailed: dict.dashboard.renewEnableFailed,

          errorFallback: dict.dashboard.errorFallback,
          errorMessages: dict.dashboard.errorMessages,
          eduMailExpiredTitle: dict.dashboard.eduMailExpiredTitle,
          eduMailExpiredBody: dict.dashboard.eduMailExpiredBody,
          ok: dict.common.ok,
        }}
        lang={lang}
        showEduExpiredOnLoad={showEduExpiredOnLoad}
      />
    </div>
  );
}
