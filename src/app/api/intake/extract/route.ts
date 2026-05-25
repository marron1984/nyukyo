import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_SYSTEM_PROMPT, extractJsonSchema } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

function errJson(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-anthropic-api-key")?.trim();
    const apiKey = headerKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return errJson(
        "APIキーが設定されていません。画面右上の「API設定」から登録してください。",
        401,
      );
    }

    const body = (await req.json().catch(() => null)) as { text?: string } | null;
    const text = body?.text;
    if (!text || typeof text !== "string" || !text.trim()) {
      return errJson("抽出するテキストを入力してください", 400);
    }
    if (text.length > 20000) {
      return errJson("テキストが長すぎます（2万文字まで）", 400);
    }

    const client = new Anthropic({ apiKey });

    // Tool use 方式で構造化出力を強制（structured outputsの初回スキーマ
    // コンパイル遅延を回避してVercelのタイムアウト内に収める）
    let response;
    try {
      response = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        system: EXTRACTION_SYSTEM_PROMPT,
        tools: [
          {
            name: "record_intake",
            description:
              "抽出した入居相談の情報を構造化データとして記録する。見つからなかった項目はプロパティごと省略する。",
            input_schema: extractJsonSchema as Anthropic.Messages.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: "record_intake" },
        messages: [
          {
            role: "user",
            content: `以下のテキストから入居相談の情報を抽出してください。\n\n----\n${text}\n----`,
          },
        ],
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) {
        return errJson("APIキーが無効です", 401);
      }
      if (e instanceof Anthropic.RateLimitError) {
        return errJson(
          "AIへのリクエストが集中しています。少し待って再実行してください。",
          429,
        );
      }
      if (e instanceof Anthropic.APIError) {
        return errJson(`AI抽出に失敗しました: ${e.message}`, e.status ?? 502);
      }
      console.error("[extract] SDK error:", e);
      return errJson(
        `AI呼び出し中にエラー: ${(e as Error).message ?? String(e)}`,
        500,
      );
    }

    const toolUse = response.content.find(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
    );
    if (!toolUse) {
      return errJson("AIが構造化データを返しませんでした", 502, {
        stop_reason: response.stop_reason,
      });
    }

    return NextResponse.json({
      ok: true,
      data: toolUse.input as Record<string, unknown>,
      usage: response.usage,
    });
  } catch (e) {
    console.error("[extract] unhandled error:", e);
    return errJson(
      `サーバ内部エラー: ${(e as Error).message ?? String(e)}`,
      500,
    );
  }
}
