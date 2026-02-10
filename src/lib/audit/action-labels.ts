export type BilingualLabel = {
  zh: string;
  en: string;
};

type AuditLang = "zh" | "en";

const UNKNOWN_ACTION_LABEL: BilingualLabel = {
  zh: "未知动作",
  en: "Unknown action",
};

const ACTION_ALIASES: Record<string, string> = {
  // legacy / mixed-language action values
  "个人邮箱登录": "user_login_personal",
  "personal mailbox login": "user_login_personal",
  "教育邮箱登录": "user_login_edu",
  "education mailbox login": "user_login_edu",
  "修改密码": "user_password_change",
  "change password": "user_password_change",

  // if some logs stored these directly
  "兑换激活码": "user_redeem",
  "redeem activation code": "user_redeem",
  "续费": "user_renew",
  "renew": "user_renew",
  "重置密码": "user_password_reset",
  "reset password": "user_password_reset",

  // admin / batch ops (some systems log human text)
  "批量生成激活码": "admin_generate_codes",
  "generate code batch": "admin_generate_codes",
  "批量撤销激活码": "admin_revoke_code_batch",
  "revoke code batch": "admin_revoke_code_batch",
};

const BILINGUAL_LABELS: Record<string, BilingualLabel> = {
  user_login_personal: { zh: "个人邮箱登录", en: "Personal mailbox login" },
  user_login_edu: { zh: "教育邮箱登录", en: "Education mailbox login" },
  user_redeem: { zh: "兑换激活码", en: "Redeem activation code" },
  user_renew: { zh: "续费", en: "Renew" },
  user_password_change: { zh: "修改密码", en: "Change password" },
  user_password_reset: { zh: "重置密码", en: "Reset password" },

  redeem_rollback: { zh: "兑换回滚", en: "Redeem rollback" },

  admin_renew_user: { zh: "管理员续费用户", en: "Admin renew user" },
  admin_suspend_user: { zh: "管理员停用用户", en: "Admin suspend user" },
  admin_unsuspend_user: { zh: "管理员解除停用", en: "Admin unsuspend user" },
  admin_reset_password: { zh: "管理员重置密码", en: "Admin reset password" },

  admin_generate_codes: { zh: "批量生成激活码", en: "Generate code batch" },
  admin_create_codes: { zh: "批量生成激活码", en: "Generate code batch" },

  admin_revoke_code: { zh: "撤销激活码", en: "Revoke activation code" },
  admin_revoke_code_batch: { zh: "批量撤销激活码", en: "Revoke code batch" },
};

const normalizeKey = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  // try exact, then lowercase for english variants
  return ACTION_ALIASES[trimmed] ?? ACTION_ALIASES[lower] ?? trimmed;
};

export function getAuditActionLabel(action: string | null | undefined): {
  label: BilingualLabel;
  normalizedKey: string | null;
  isKnown: boolean;
} {
  const normalizedKey = normalizeKey(action);
  if (!normalizedKey) {
    return { label: UNKNOWN_ACTION_LABEL, normalizedKey: null, isKnown: false };
  }

  const label = BILINGUAL_LABELS[normalizedKey];
  if (label) {
    return { label, normalizedKey, isKnown: true };
  }

  return { label: UNKNOWN_ACTION_LABEL, normalizedKey, isKnown: false };
}

/**
 * Return a single-language action text that follows current lang:
 * - zh => label.zh
 * - en => label.en
 */
export function getAuditActionText(action: string | null | undefined, lang: AuditLang): string {
  const { label } = getAuditActionLabel(action);
  return lang === "zh" ? label.zh : label.en;
}
