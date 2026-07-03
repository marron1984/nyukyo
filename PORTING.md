# 移植ガイド — 入居相談 受付フォーム & 管理画面

この機能一式を別リポジトリへ移植するための手順書です。
移植パターンは2通りあります。用途に合わせて選んでください。

| パターン | 向いているケース |
|---|---|
| **A. アプリ丸ごと移植** | 新リポジトリをこの機能専用にする（一番簡単・確実） |
| **B. 既存 Next.js アプリに組み込み** | すでに動いている Next.js プロジェクトの1機能として追加する |

---

## 全体アーキテクチャ

```
ブラウザ
  │
  ├── /            受付フォーム（テンプレ貼り付け → 自動パース → 確認 → 送信）
  ├── /admin       管理画面（一覧・検索・ソート・ステータス変更・編集・削除・CSV）
  │
  ▼ fetch
Next.js API Routes（サーバ側。シークレットはここだけが知っている）
  ├── POST /api/intake         登録
  ├── GET  /api/admin/list     一覧取得
  ├── POST /api/admin/update   セル更新
  └── POST /api/admin/delete   行削除
  │
  ▼ HTTPS POST（GAS_WEBAPP_URL / GAS_SHARED_SECRET）
Google Apps Script（gas/Code.gs をウェブアプリとしてデプロイ）
  │
  ▼
Google スプレッドシート（16列）
```

**ポイント**: フロントは GAS の URL もシークレットも知りません。
必ず Next.js の API Route を経由します。移植先でもこの構造を崩さないでください。

---

## 必要ファイル一覧（コピー対象）

### コア機能（必須）

```
src/lib/schema.ts        # zodスキーマ（フォームの型と検証の心臓部）
src/lib/parse.ts         # 【ラベル】形式テキストのパーサ
src/lib/format.ts        # フォーム値 → テンプレ形式テキストへの整形
src/lib/sample.ts        # 空テンプレート & サンプルデータ
src/lib/gas.ts           # GAS呼び出しの共通クライアント

src/app/api/intake/route.ts        # 登録API
src/app/api/admin/list/route.ts    # 一覧API
src/app/api/admin/update/route.ts  # 更新API
src/app/api/admin/delete/route.ts  # 削除API

src/components/IntakeForm.tsx  # 受付フォーム本体
src/components/Field.tsx       # ラベル+必須バッジ+エラー表示のフィールド部品
src/components/Toast.tsx       # トースト通知

src/app/page.tsx               # 受付フォームのページ
src/app/admin/page.tsx         # 管理画面のページ（サーバ側の薄いラッパ）
src/app/admin/AdminClient.tsx  # 管理画面本体
```

### スタイル・設定（パターンAは必須 / パターンBは統合）

```
src/app/globals.css      # デザイントークン・フォーカスリング等
src/app/layout.tsx       # ルートレイアウト
tailwind.config.ts       # カラーパレット（brand/yolk/status等）
postcss.config.js
tsconfig.json            # "@/*" → "./src/*" のパスエイリアスが必要
next.config.mjs
```

### Google Apps Script（必須・リポジトリ外の作業あり）

```
gas/Code.gs              # doPost: create / list / update / delete
gas/appsscript.json
```

---

## 依存パッケージ

```bash
npm install react-hook-form @hookform/resolvers zod
npm install -D tailwindcss autoprefixer postcss   # 未導入の場合のみ
```

- Next.js 14 (App Router) / React 18 で動作確認済み
- zod は **v3**（v4 は `@hookform/resolvers` との組み合わせ確認が必要）

---

## 環境変数（2つだけ）

`.env.local`（ローカル）/ Vercel等の環境変数（本番）:

```bash
GAS_WEBAPP_URL=https://script.google.com/macros/s/XXXXX/exec
GAS_SHARED_SECRET=任意の長いランダム文字列
```

`GAS_SHARED_SECRET` は GAS 側のスクリプトプロパティ `SHARED_SECRET` と同じ値にします。

---

## パターンA: アプリ丸ごと移植

```bash
# 1. 新リポジトリで Next.js を初期化（App Router / TypeScript / Tailwind）
npx create-next-app@14 my-new-repo --typescript --tailwind --app --src-dir

# 2. このリポジトリから上記ファイル一覧を丸ごとコピー
#    （src/ と gas/ と tailwind.config.ts を上書き）

# 3. 依存を追加
npm install react-hook-form @hookform/resolvers zod

# 4. .env.local を作成（上記2変数）

# 5. 動作確認
npm run dev
```

## パターンB: 既存 Next.js アプリに組み込み

1. `src/lib/` の5ファイル、`src/components/` の3ファイル、`src/app/api/` の4ルートをコピー
2. ページの配置場所を決める（例: `/consultation` 配下に置くなら）
   - `src/app/consultation/page.tsx` ← `page.tsx` の中身
   - `src/app/consultation/admin/page.tsx` + `AdminClient.tsx`
   - AdminClient 内の `href="/"` を `href="/consultation"` に変更
3. `tailwind.config.ts` に**カラートークンをマージ**（下記「デザイントークン」参照）
4. `globals.css` の `.step-num` と フォーカスリングのスタイルを既存CSSに追記
5. パスエイリアス `@/*` が異なる場合は import を書き換え
6. 環境変数2つを追加

### デザイントークン（tailwind.config.ts に追加するもの）

```ts
colors: {
  ink:   { DEFAULT: "#14181f", soft: "#333c4b", fade: "#525d6e", mute: "#8b94a3" },
  paper: { DEFAULT: "#ffffff", off: "#fafaf7", warm: "#f5f3ed" },
  brand: { DEFAULT: "#1e3a5f", deep: "#16294a", soft: "#e8eef5", line: "#c7d4e3" },
  yolk:  { DEFAULT: "#e8b923", deep: "#c79b15", soft: "#fff4ce" },
  status: {
    new: "#2563eb",      newBg: "#dbeafe",
    progress: "#d97706", progressBg: "#fed7aa",
    hold: "#6b7280",     holdBg: "#e5e7eb",
    done: "#059669",     doneBg: "#d1fae5",
    cancel: "#dc2626",   cancelBg: "#fee2e2",
  },
},
boxShadow: {
  card: "0 1px 3px 0 rgba(20,30,55,0.05), 0 1px 2px 0 rgba(20,30,55,0.03)",
  soft: "0 4px 12px -2px rgba(20,30,55,0.08), 0 2px 4px -1px rgba(20,30,55,0.04)",
  lift: "0 12px 32px -8px rgba(20,30,55,0.15), 0 4px 8px -2px rgba(20,30,55,0.06)",
},
```

---

## Google Apps Script のセットアップ（移植先ごとに1回）

> 既存の GAS デプロイを使い回す場合はこの節は不要。
> 新しいスプレッドシートに向ける場合のみ実施。

1. [script.google.com](https://script.google.com) で新規プロジェクト作成
2. `gas/Code.gs` の内容を貼り付け
3. **スクリプトプロパティ**（プロジェクトの設定 → スクリプトプロパティ）に3つ登録:
   | キー | 値 |
   |---|---|
   | `SPREADSHEET_ID` | スプレッドシートURLの `/d/` と `/edit` の間の文字列 |
   | `SHEET_NAME` | シート名（省略時は「メールから」） |
   | `SHARED_SECRET` | `.env.local` の `GAS_SHARED_SECRET` と同じ値 |
4. **デプロイ → 新しいデプロイ → ウェブアプリ**
   - 実行ユーザー: **自分**
   - アクセスできるユーザー: **全員**
5. 発行された URL（`.../exec`）を `GAS_WEBAPP_URL` に設定

> ⚠️ `Code.gs` を書き換えたら「デプロイを管理 → 編集 → 新バージョン」で
> **再デプロイ**が必要です（保存だけでは本番に反映されません）。

---

## スプレッドシートの列仕様（16列・この順序）

| # | 列名 | フォームの対応フィールド |
|---|---|---|
| 1 | No. | 自動採番（既存最大+1） |
| 2 | 問い合わせ日 | inquiryDate（YYYY/MM/DD） |
| 3 | ステータス | status |
| 4 | 名前 | customerName |
| 5 | 年齢 | age（「歳」付き） |
| 6 | 性別 | gender |
| 7 | 入居場所 | residenceLocation |
| 8 | 連絡先 | contact + 御社名 + 担当を結合 |
| 9 | キーパーソン | keyPerson |
| 10 | 介護度 | careLevel |
| 11 | 状況 | situation + others を結合 |
| 12 | ADL詳細 | ADL5項目 + adlDetail を結合 |
| 13 | 希望物件 | preferredProperty |
| 14 | エント希望 | ent |
| 15 | 借金有無 | hasDebt（+補足） |
| 16 | 費用 | budgetYen（「N円\nまで」形式） |

列を変える場合は `gas/Code.gs` の `COLUMN_HEADERS_` / `formToRow_` と、
`AdminClient.tsx` の `COLUMN_HEADERS` / 列インデックス（`c0`〜`c15`）を揃えて変更してください。

---

## 移植後の動作確認チェックリスト

- [ ] `npm run build` が通る
- [ ] `/` でフォームが表示され、「サンプル投入」→「確認して送信」でシートに1行追加される
- [ ] シートの行が16列すべて正しい列に入っている
- [ ] `/admin` で一覧が表示される
- [ ] 行のステータスをプルダウンで変えるとシートに反映される
- [ ] 詳細モーダルの「編集 → 保存」がシートに反映される
- [ ] 削除でシートの行が消える
- [ ] CSV出力が文字化けしない（BOM付きUTF-8）
- [ ] スマホ幅で管理画面がカード表示に切り替わる

## よくあるハマりどころ

| 症状 | 原因 |
|---|---|
| 送信すると 502 / unauthorized | `SHARED_SECRET`（GAS側）と `GAS_SHARED_SECRET`（Next側）の不一致 |
| GASを直したのに動きが変わらない | 再デプロイ忘れ（新バージョンの発行が必要） |
| `@/lib/...` が解決できない | tsconfig の paths エイリアス未設定 |
| 色が全部デフォルトに見える | tailwind.config.ts のトークン未マージ、または `content` にコピー先パスが含まれていない |
| 管理画面の費用列がずれる | 列構成変更時に `c15` などのインデックス更新漏れ |
