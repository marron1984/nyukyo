import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "nyukyo_admin";

function sign(value: string): string {
  const secret = process.env.GAS_SHARED_SECRET ?? "fallback-secret";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function makeSessionToken(): string {
  const issued = Date.now().toString();
  return `${issued}.${sign(issued)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issued, mac] = token.split(".");
  if (!issued || !mac) return false;
  const expected = sign(issued);
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  // 24時間で失効
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt)) return false;
  return Date.now() - issuedAt < 24 * 60 * 60 * 1000;
}

export function isAdminAuthed(): boolean {
  const c = cookies().get(COOKIE_NAME)?.value;
  return isValidSessionToken(c);
}

export const ADMIN_COOKIE = COOKIE_NAME;
