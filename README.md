# 2026年3月同期会 Event Café

VRChat上で開催予定のカフェ風Barイベント向けサイトです。一般のお客様・入部希望者向け公開サイトと、部員だけが使う運営用管理サイト（`/admin`）を含みます。

## 使用技術
React / TypeScript / Vite / React Router / Firebase Authentication / Cloud Firestore / Cloud Functions / Firebase Hosting / Firebase Emulator Suite / Vitest / React Testing Library / ESLint / Prettier / CSS

## 必要環境
- Node.js 20以上
- Firebase CLI
- Firebaseプロジェクト（Auth, Firestore, Functions, Hosting）

## インストール
```bash
npm install
cd functions && npm install && cd ..
```

## ローカル起動
`.env.example`を参考に`.env.local`を作成し、Firebase Web App設定値を登録します。
```bash
npm run dev
```

## Firebaseプロジェクト作成と設定
1. Firebase Consoleでプロジェクトを作成します。
2. Authenticationを有効化します。
3. Firestore Databaseを作成します。
4. FunctionsとHostingを有効化します。
5. Web Appを追加し、`.env.local`へ以下の値を設定します（値はGitへコミットしないでください）。
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## 管理者パスワードSecret登録
初期パスワードは動作確認用です。公開運用前に必ず変更してください。READMEには実値を記載しません。
```bash
firebase functions:secrets:set ADMIN_SHARED_PASSWORD
```
プロンプトで動作確認用の初期値、または公開用に変更した強いパスワードを入力してください。

## Firebase Emulator Suite
```bash
VITE_USE_FIREBASE_EMULATORS=true npm run dev
firebase emulators:start
```
エミュレータでAuth、Firestore、Functions、Hostingの動作確認を行えます。

## デプロイ
```bash
npm run build
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```
Vercelを使う場合は`npm run build`の出力先`dist`を公開してください。Cloud FunctionsとFirestore RulesはFirebaseへ別途デプロイが必要です。

## テスト・品質確認
```bash
npm run typecheck
npm run lint
npm test
npm run build
cd functions && npm run build
```

## データ構成
- `activities`: 活動予定
- `members`: 部員情報
- `lotteryEntries`: 抽選候補者
- `lotteryDraws`: 抽選履歴
- `siteSettings/public`: サイト設定・受付状態
- `adminAuditLogs`: 監査ログ

## サンプルデータの削除
管理画面からサンプル保存したデータ、またはFirestore Console上の「サンプル」と明記された活動・部員データを公開前に削除または実データへ差し替えてください。

## Gitへコミットしてはいけないファイル
`.env`, `.env.local`, FirebaseサービスアカウントJSON、Secret値、個人情報を含む抽選候補者エクスポート。

## 注意
Firebaseログイン情報やプロジェクト権限がない環境では実デプロイはできません。ローカルビルドとテスト後、上記手順で利用者がデプロイしてください。
