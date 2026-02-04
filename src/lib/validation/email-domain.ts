export const BLOCKED_PERSONAL_EMAIL_DOMAINS = ["nsuk.edu.kg"] as const;

export function isBlockedPersonalEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return BLOCKED_PERSONAL_EMAIL_DOMAINS.some((domain) => normalized.endsWith(`@${domain}`));
}
