import { format } from "date-fns";

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function formatDate(value: string | Date) {
  return format(new Date(value), "yyyy-MM-dd") + " (UTC)";
}
