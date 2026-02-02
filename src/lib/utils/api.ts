import { NextResponse } from "next/server";

export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, detail?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(detail ?? {}) }, { status });
}
