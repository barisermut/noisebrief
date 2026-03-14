export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***@***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const prefix = local.length >= 3 ? local.slice(0, 3) : local.slice(0, 1) || "?";
  return `${prefix}***@${domain}`;
}
