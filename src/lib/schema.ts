import { z } from "zod";

export const CARE_LEVELS = [
  "自立",
  "要支援1",
  "要支援2",
  "要介護1",
  "要介護2",
  "要介護3",
  "要介護4",
  "要介護5",
] as const;

export const GENDERS = ["男性", "女性", "その他"] as const;

export const intakeSchema = z.object({
  inquiryDate: z.string().min(1, "問い合わせ日は必須です"),
  customerName: z.string().min(1, "顧客名は必須です"),
  age: z.coerce.number().int().min(0).max(130).optional().or(z.literal("" as unknown as number)),
  gender: z.enum(GENDERS),
  careLevel: z.enum(CARE_LEVELS),
  budgetYen: z.coerce.number().int().min(0).optional().or(z.literal("" as unknown as number)),

  adlSitting: z.string().default(""),
  adlStanding: z.string().default(""),
  adlToilet: z.string().default(""),
  adlMeal: z.string().default(""),
  adlCommunication: z.string().default(""),
  adlDetail: z.string().default(""),

  hasDebt: z.enum(["あり", "なし"]),
  debtNote: z.string().default(""),

  situation: z.string().default(""),
  ent: z.string().default("未確認"),
  others: z.string().default(""),

  keyPerson: z.string().default(""),
  companyName: z.string().default("未確認"),
  contactPerson: z.string().default("未確認"),
});

export type IntakeForm = z.infer<typeof intakeSchema>;
