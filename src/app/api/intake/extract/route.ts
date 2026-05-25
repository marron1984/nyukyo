import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { EXTRACTION_SYSTEM_PROMPT, extractJsonSchema } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const headerKey = req.headers.get("x-anthropic-api-key")?.trim();
  const apiKey = headerKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "APIキーが設定されていません。画面右上の「API設定」から登録してください。",
      },
      { status: 401 },
    );
  }

  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "抽出するテキストを入力してください" },
      { status: 400 },
    );
  }

  if (text.length > 20000) {
    return NextResponse.json(
      { error: "テキストが長すぎます（2万文字まで）" },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      output_config: { format: jsonSchemaOutputFormat(extractJsonSchema) },
      messages: [
        {
          role: "user",
          content: `以下のテキストから入居相談の情報を抽出してください。\n\n----\n${text}\n----`,
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      return NextResponse.json(
        { error: "AI が出力を返しませんでした", stop_reason: response.stop_reason },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: parsed,
      usage: response.usage,
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "APIキーが無効です" }, { status: 401 });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "AIへのリクエストが集中しています。少し待って再実行してください。" },
        { status: 429 },
      );
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI抽出に失敗しました: ${e.message}` },
        { status: e.status ?? 502 },
      );
    }
    return NextResponse.json(
      { error: (e as Error).message ?? "不明なエラー" },
      { status: 500 },
    );
  }
}
