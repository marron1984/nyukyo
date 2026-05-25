const STORAGE_KEY = "nyukyo.anthropic_api_key";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key) window.localStorage.setItem(STORAGE_KEY, key);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function maskApiKey(key: string): string {
  if (!key) return "(未設定)";
  if (key.length <= 14) return key.slice(0, 4) + "…";
  return `${key.slice(0, 10)}…${key.slice(-4)}`;
}
