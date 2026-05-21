import { NextResponse } from "next/server";
import { intakeSchema } from "@/lib/schema";
import { formatIntakeMessage } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = intakeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力に不備があります", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const url = process.env.GAS_WEBAPP_URL;
  const secret = process.env.GAS_SHARED_SECRET;
  if (!url || !secret) {
    return NextResponse.json(
      { error: "サーバ設定（GAS_WEBAPP_URL / GAS_SHARED_SECRET）が未設定です" },
      { status: 500 },
    );
  }

  const message = formatIntakeMessage(parsed.data);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, payload: parsed.data, message }),
    redirect: "follow",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "GAS転送に失敗しました", upstream: data },
      { status: 502 },
    );
  }
  return NextResponse.json(data);
}
