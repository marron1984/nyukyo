# 入居相談 受付フォーム

Webフォームから入居相談を受け付け、Googleスプレッドシートに自動転記する仕組み。

```
[ブラウザ] → Next.js (/app + /api/intake) → GAS Web App (doPost) → Spreadsheet.appendRow
```

## 1. ローカル起動

```bash
npm install
cp .env.example .env.local   # GAS_WEBAPP_URL / GAS_SHARED_SECRET を埋める
npm run dev                  # http://localhost:3000
```

## 2. Google Apps Script のデプロイ

1. https://script.google.com で新規プロジェクト作成。
2. `gas/Code.gs`, `gas/appsscript.json` の中身を貼り付け（`appsscript.json` を見るには「プロジェクトの設定 → 'appsscript.json' マニフェスト ファイルをエディタで表示する」をON）。
3. **スクリプト プロパティ**（プロジェクトの設定 → スクリプト プロパティ）に以下を登録:

   | キー | 値 |
   |---|---|
   | `SHARED_SECRET` | `.env.local` の `GAS_SHARED_SECRET` と同じ値 |
   | `SPREADSHEET_ID` | 書き込み先スプレッドシートのID（URLの `/d/` と `/edit` の間） |
   | `SHEET_NAME` | シート名（未設定なら `入居相談` を自動作成） |

4. エディタ上で `testIntake` を実行し、スプレッドシート1行追加を目視確認。
5. 「デプロイ → 新しいデプロイ → 種類: ウェブアプリ」で
   - 実行するユーザー: 自分
   - アクセスできるユーザー: 全員
   としてデプロイ → 取得した `https://script.google.com/macros/s/.../exec` URL を `.env.local` の `GAS_WEBAPP_URL` に設定。

## 3. 動作確認

- `npm run dev` → フォーム送信 → ブラウザに「スプレッドシートに記録しました」と表示。
- スプレッドシートに1行追加されていること。

## 管理画面

- `/admin` … 受付一覧（検索・介護度フィルタ・詳細表示・テンプレ形式コピー・削除）

認証は外してあるため URL を知っていれば誰でも閲覧できます。社外公開しない運用前提で、URLは公開しないこと。後から保護が必要になった場合は Vercel の **Deployment Protection**（Password Protection）か Cloudflare Access の前段配置を推奨。

## テンプレ文字列について

`src/lib/format.ts` の `formatIntakeMessage` が、管理画面の詳細モーダルで「テンプレ形式でコピー」する際の本文を生成します。
