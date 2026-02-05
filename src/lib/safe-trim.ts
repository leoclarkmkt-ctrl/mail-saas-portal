/**
 * 安全地 trim 字符串，处理 null/undefined
 */
export function safeTrim(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

/**
 * 安全地 trim 并转小写
 */
export function safeTrimLower(value: unknown): string {
  return safeTrim(value).toLowerCase();
}
