import { NextResponse } from "next/server";
import { callGas } from "@/lib/gas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { rowNumber, cells } = (await req.json().catch(() => ({}))) as {
    rowNumber?: number;
    cells?: Record<string, string>;
  };
  if (!rowNumber || rowNumber < 2) {
    return NextResponse.json({ error: "invalid rowNumber" }, { status: 400 });
  }
  if (!cells || typeof cells !== "object") {
    return NextResponse.json({ error: "invalid cells" }, { status: 400 });
  }
  const { ok, data } = await callGas({ action: "update", rowNumber, cells });
  if (!ok) {
    return NextResponse.json(
      { error: "GAS更新に失敗しました", upstream: data },
      { status: 502 },
    );
  }
  return NextResponse.json(data);
}
