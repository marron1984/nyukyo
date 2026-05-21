import { NextResponse } from "next/server";
import { callGas } from "@/lib/gas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { rowNumber } = (await req.json().catch(() => ({}))) as {
    rowNumber?: number;
  };
  if (!rowNumber || rowNumber < 2) {
    return NextResponse.json({ error: "invalid rowNumber" }, { status: 400 });
  }
  const { ok, data } = await callGas({ action: "delete", rowNumber });
  if (!ok) {
    return NextResponse.json(
      { error: "GAS削除に失敗しました", upstream: data },
      { status: 502 },
    );
  }
  return NextResponse.json(data);
}
