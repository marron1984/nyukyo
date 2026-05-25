import { z } from "zod";
import { CARE_LEVELS, GENDERS } from "./schema";

export const extractJsonSchema = {
  type: "object",
  properties: {
    inquiryDate: { type: "string", description: "問い合わせ日 ISO形式 YYYY-MM-DD" },
    customerName: { type: "string", description: "顧客名（イニシャル可、敬称含む）" },
    age: { type: "integer", minimum: 0, maximum: 130, description: "年齢（歳）" },
    gender: { type: "string", enum: [...GENDERS], description: "性別" },
    residenceLocation: { type: "string", description: "市区町村レベルの居住地" },
    contact: { type: "string", description: "連絡先（電話・メール等）" },
    keyPerson: { type: "string", description: "キーパーソン（例：奥様、長男）" },
    careLevel: { type: "string", enum: [...CARE_LEVELS], description: "介護度" },
    budgetYen: { type: "integer", minimum: 0, description: "月額上限（円・数値）" },
    adlSitting: { type: "string", description: "ADL 座位" },
    adlStanding: { type: "string", description: "ADL 立位" },
    adlToilet: { type: "string", description: "ADL 排泄" },
    adlMeal: { type: "string", description: "ADL 食事" },
    adlCommunication: { type: "string", description: "ADL 意思疎通" },
    adlDetail: { type: "string", description: "ADL の補足説明" },
    preferredProperty: { type: "string", description: "希望物件" },
    ent: { type: "string", description: "エント情報" },
    hasDebt: { type: "string", enum: ["あり", "なし"], description: "借金の有無" },
    debtNote: { type: "string", description: "借金の補足" },
    situation: { type: "string", description: "現在の詳細状況の文章要約" },
    others: { type: "string", description: "その他特記事項" },
    companyName: { type: "string", description: "依頼元の会社名" },
    contactPerson: { type: "string", description: "依頼元の担当者名" },
  },
  additionalProperties: false,
} as const;

/**
 * AI抽出専用スキーマ。すべて任意項目（AIが見つけられないこともある）。
 * intakeSchema と異なり .default() / .coerce は使わない（構造化出力に渡すため）。
 */
export const extractSchema = z.object({
  inquiryDate: z
    .string()
    .optional()
    .describe("問い合わせ日 ISO形式 YYYY-MM-DD。読み取れない場合は省略。"),
  customerName: z
    .string()
    .optional()
    .describe("顧客名（イニシャル可）。敬称含めて記載（例: 鈴木一世様）。"),
  age: z.number().int().min(0).max(130).optional().describe("年齢（歳）"),
  gender: z.enum(GENDERS).optional().describe("性別"),
  residenceLocation: z
    .string()
    .optional()
    .describe("入居場所・現住所の市区町村レベル（例: 大阪市鶴見区）"),
  contact: z
    .string()
    .optional()
    .describe("電話番号・メール等の連絡先"),
  keyPerson: z
    .string()
    .optional()
    .describe("キーパーソン（例: 奥様、長男など）"),
  careLevel: z.enum(CARE_LEVELS).optional().describe("介護度"),
  budgetYen: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("月額費用の上限（円・数値のみ）"),
  adlSitting: z.string().optional().describe("ADL 座位（例: 自立）"),
  adlStanding: z.string().optional().describe("ADL 立位"),
  adlToilet: z.string().optional().describe("ADL 排泄"),
  adlMeal: z.string().optional().describe("ADL 食事"),
  adlCommunication: z.string().optional().describe("ADL 意思疎通"),
  adlDetail: z
    .string()
    .optional()
    .describe("ADL の補足説明・詳細を要約した文章"),
  preferredProperty: z.string().optional().describe("希望物件"),
  ent: z.string().optional().describe("エント情報"),
  hasDebt: z.enum(["あり", "なし"]).optional().describe("借金の有無"),
  debtNote: z.string().optional().describe("借金の補足"),
  situation: z
    .string()
    .optional()
    .describe(
      "現在の詳細状況（生年月日・住所・家族構成・経緯など、本人の置かれている状況の文章要約）",
    ),
  others: z
    .string()
    .optional()
    .describe("その他特記事項（徘徊・被害妄想 等）"),
  companyName: z
    .string()
    .optional()
    .describe("依頼元の会社名（記載がなければ省略）"),
  contactPerson: z
    .string()
    .optional()
    .describe("依頼元の担当者名"),
});

export type ExtractResult = z.infer<typeof extractSchema>;

export const EXTRACTION_SYSTEM_PROMPT = `あなたは介護施設の入居相談を受け付ける窓口担当者です。
電話の音声書き起こしや、自由記述のメモ、メール本文などから、入居相談に必要な項目を抽出して構造化データとして返してください。

# 抽出ルール
- 文中に明示されていない項目は出力に含めない（推測しない）。
- 日付は西暦・ISO形式（YYYY-MM-DD）に正規化。「来週月曜」など相対表現は省略。
- 年齢は数値のみ（「78歳」→ 78）。
- 介護度は「自立 / 要支援1 / 要支援2 / 要介護1〜5」のいずれか。「要介護2程度」のような曖昧表現は最も近いものに丸める。
- 性別は「男性 / 女性 / その他」のいずれか。
- 費用は月額の上限を円単位の数値で（「14万円まで」→ 140000、「月15万」→ 150000）。
- ADLは各項目ごとに自立度合いを短く（例: 自立、一部介助、全介助、見守り、不可 等）。明示されていない項目は省略。
- adlDetail には ADL に関する補足説明や流れを文章で。
- situation には生年月日・住所・家族構成・発症経緯など、本人の現状を文章で要約。
- residenceLocation は市区町村レベルまで（番地まで含めない）。
- 「借金なし」「借入なし」「ローンなし」→ hasDebt: "なし"。借金がある場合は debtNote に内容を。
- キーパーソン、御社名、ご担当者名は明示されていない場合は省略（"未確認"などのプレースホルダは入れない）。

# 出力
構造化スキーマに従って JSON を返してください。見つからなかった項目はキーごと省略してください。`;
