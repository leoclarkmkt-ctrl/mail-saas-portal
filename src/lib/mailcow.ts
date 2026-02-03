import { getMailcowEnv } from "@/lib/env";

type MailcowResult = {
  ok: boolean;
  error?: string;
  detail?: unknown;
};

const DEFAULT_TIMEOUT_MS = 10000;

const toErrorMessage = (value: unknown) => {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "Unknown error";
  }
};

const request = async (
  path: string,
  method: "GET" | "POST" = "POST",
  body?: Record<string, unknown>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<MailcowResult> => {
  const { MAILCOW_API_BASE_URL, MAILCOW_API_KEY } = getMailcowEnv();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${MAILCOW_API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MAILCOW_API_KEY
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const text = await res.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (!res.ok) {
      return {
        ok: false,
        error: `Mailcow API error (${res.status})`,
        detail: parsed ?? text
      };
    }
    const apiOk =
      Array.isArray(parsed) ? parsed.every((item) => item?.type === "success") : true;
    if (!apiOk) {
      return {
        ok: false,
        error: "Mailcow API returned failure",
        detail: parsed
      };
    }
    return { ok: true, detail: parsed };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function createMailbox(
  email: string,
  password: string,
  name = "",
  quotaMb = 5
): Promise<MailcowResult> {
  const [localPart, domain] = email.split("@");
  return request("/add/mailbox", "POST", {
    local_part: localPart,
    domain,
    password,
    password2: password,
    name,
    quota: quotaMb,
    active: 1
  });
}

export async function updateMailboxPassword(
  email: string,
  password: string
): Promise<MailcowResult> {
  return request("/edit/mailbox", "POST", {
    items: [email],
    attr: { password, password2: password }
  });
}

export async function setMailboxActive(email: string, active: boolean): Promise<MailcowResult> {
  return request("/edit/mailbox", "POST", {
    items: [email],
    attr: { active: active ? 1 : 0 }
  });
}

export async function checkMailcowStatus(): Promise<MailcowResult> {
  return request("/get/status", "GET");
}
