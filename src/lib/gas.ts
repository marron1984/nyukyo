export type GasAction =
  | { action: "list" }
  | { action: "delete"; rowNumber: number }
  | { action: "create"; payload: unknown };

export async function callGas(body: GasAction): Promise<{
  ok: boolean;
  status: number;
  data: unknown;
}> {
  const url = process.env.GAS_WEBAPP_URL;
  const secret = process.env.GAS_SHARED_SECRET;
  if (!url || !secret) {
    return {
      ok: false,
      status: 500,
      data: { error: "GAS_WEBAPP_URL / GAS_SHARED_SECRET が未設定です" },
    };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, ...body }),
    redirect: "follow",
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}
