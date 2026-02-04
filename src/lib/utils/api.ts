import { NextResponse } from "next/server";

export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, detail?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...(detail ?? {}) }, { status });
}

export function jsonFieldError(
  field: string,
  key: string,
  status = 400,
  message?: string
) {
  return NextResponse.json(
    { ok: false, error: { field, key, ...(message ? { message } : {}) } },
    { status }
  );
}
