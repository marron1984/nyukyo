import { NextResponse } from "next/server";
import { intakeSchema } from "@/lib/schema";
import { callGas } from "@/lib/gas";

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

  const { ok, data } = await callGas({
    action: "create",
    payload: parsed.data,
  });

  if (!ok) {
    return NextResponse.json(
      { error: "GAS転送に失敗しました", upstream: data },
      { status: 502 },
    );
  }
  return NextResponse.json(data);
}
