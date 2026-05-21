import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { callGas } from "@/lib/gas";

export const runtime = "nodejs";

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { ok, data } = await callGas({ action: "list" });
  if (!ok) {
    return NextResponse.json(
      { error: "GAS取得に失敗しました", upstream: data },
      { status: 502 },
    );
  }
  return NextResponse.json(data);
}
