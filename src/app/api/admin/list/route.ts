import { NextResponse } from "next/server";
import { callGas } from "@/lib/gas";

export const runtime = "nodejs";

export async function GET() {
  const { ok, data } = await callGas({ action: "list" });
  if (!ok) {
    return NextResponse.json(
      { error: "GAS取得に失敗しました", upstream: data },
      { status: 502 },
    );
  }
  return NextResponse.json(data);
}
