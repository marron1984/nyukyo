# 入居相談 受付フォーム

Webフォームから入居相談を受け付け、Googleスプレッドシートに自動転記しつつ LINE Works のトークルームに通知する仕組み。

```
[ブラウザ] → Next.js (/app + /api/intake) → GAS Web App (doPost)
                                              ├─ Spreadsheet.appendRow
                                              └─ LINE Works Bot API
```

## 1. ローカル起動

```bash
npm install
cp .env.example .env.local   # GAS_WEBAPP_URL / GAS_SHARED_SECRET を埋める
npm run dev                  # http://localhost:3000
```

## 2. Google Apps Script のデプロイ

1. https://script.google.com で新規プロジェクト作成。
2. `gas/Code.gs`, `gas/lineworks.gs`, `gas/appsscript.json` の中身を貼り付け（`appsscript.json` を見るには「プロジェクトの設定 → 'appsscript.json' マニフェスト ファイルをエディタで表示する」をON）。
3. **スクリプト プロパティ**（プロジェクトの設定 → スクリプト プロパティ）に以下を登録:

   | キー | 値 |
   |---|---|
   | `SHARED_SECRET` | `.env.local` の `GAS_SHARED_SECRET` と同じ値 |
   | `SPREADSHEET_ID` | 書き込み先スプレッドシートのID（URLの `/d/` と `/edit` の間） |
   | `SHEET_NAME` | シート名（未設定なら `入居相談` を自動作成） |
   | `LW_CLIENT_ID` | LINE Works Developer Console の App `Client ID` |
   | `LW_CLIENT_SECRET` | 同 `Client Secret` |
   | `LW_SERVICE_ACCOUNT` | Service Account（`xxx.serviceaccount@<domain>` 形式） |
   | `LW_PRIVATE_KEY` | Service Account 用の RSA 秘密鍵（`-----BEGIN PRIVATE KEY-----` から末尾まで） |
   | `LW_BOT_ID` | Bot ID |
   | `LW_CHANNEL_ID` | 通知先トークルームのチャネルID |

4. エディタ上で `testIntake` を実行し、スプレッドシート1行追加と LINE Works テスト通知を目視確認。
5. 「デプロイ → 新しいデプロイ → 種類: ウェブアプリ」で
   - 実行するユーザー: 自分
   - アクセスできるユーザー: 全員
   としてデプロイ → 取得した `https://script.google.com/macros/s/.../exec` URL を `.env.local` の `GAS_WEBAPP_URL` に設定。

## 3. 動作確認

- `npm run dev` → フォーム送信 → ブラウザに「スプレッドシートに記録しました／LINE Worksに通知しました」と表示。
- スプレッドシートに1行追加されていること。
- LINE Works の指定トークルームに通知が届くこと。

## 通知本文フォーマット

`src/lib/format.ts` の `formatIntakeMessage` がユーザー提示のテンプレートそのままで本文を生成します。
