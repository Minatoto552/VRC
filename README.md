# 2026年3月同期会 Event Cafe

VRChat 向けの「2026年3月同期会 Event Cafe」公開サイトと、運営用管理サイトをまとめたリポジトリです。  
公開サイトはスマートフォン優先で、活動予定、部員紹介、入部案内、抽選受付、FAQ を提供します。  
管理サイトは `/admin` で動作し、Firebase Authentication、Cloud Functions、Cloud Firestore、Security Rules を前提に運営機能を扱います。

## 使用技術

- React 19
- TypeScript
- Vite
- React Router
- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Functions v2
- Firebase Hosting
- Firebase Emulator Suite
- Vitest
- React Testing Library
- ESLint
- Prettier
- CSS

## 必要な環境

- Node.js 24 系推奨
- npm 11 系推奨
- Firebase CLI を `npx firebase` で実行できること
- Firestore Emulator を使う場合は Java を PATH に追加しておくこと

## インストール方法

```bash
npm install
npm --prefix functions install
```

## ローカル起動方法

1. `.env.example` を `.env.local` にコピーします。
2. Firebase Console で Web App を作成し、設定値を `.env.local` に入れます。
3. 開発サーバーを起動します。

```bash
npm run dev
```

Firebase 未設定でもサンプルモードで公開画面の確認はできます。  
管理ログインと Cloud Functions 呼び出しは Firebase 設定後に利用してください。

## 写真スライドとイラスト差し替え

- ホーム上部の写真スライドは `public/gallery/manifest.json` があれば自動で読み込みます。未配置時はプレースホルダー表示になります。
- 追加方法は `public/gallery/manifest.example.json` を `public/gallery/manifest.json` としてコピーし、画像を `public/gallery/` に置いて `src` を更新してください。
- 画像 URL は `/gallery/<filename>` でも、`https://...` の絶対 URL でも指定できます。
- キャラクターイラストの切り抜きは `scripts/extract_character_cutouts.py` で再生成できます。

```bash
C:\Users\maron\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe scripts/extract_character_cutouts.py
```

## Firebase プロジェクト作成方法

認証済みの Firebase CLI がある環境で実行してください。

```bash
npx firebase login
npx firebase projects:create <your-project-id>
npx firebase use --add
```

その後、Firebase Console で以下を有効化してください。

- Authentication
- Firestore Database
- Cloud Functions
- Hosting

## Firebase 設定値の登録方法

`.env.local` に以下を設定します。

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATORS=false
```

`.env.example` には変数名だけを置いてあり、実値は含めていません。

## Firebase Emulator Suite の使用方法

`.env.local` に以下を設定します。

```env
VITE_USE_FIREBASE_EMULATORS=true
```

起動:

```bash
npm run emulators
```

Windows でリポジトリの絶対パスに日本語などの非 ASCII 文字が含まれる場合、`npm run emulators` は自動的に ASCII パスのジャンクションを経由して Firebase Functions Emulator を起動します。追加の手動移動は不要です。

ローカルの Functions Emulator で Secret を使う場合は、`functions/.secret.local` に `ADMIN_SHARED_PASSWORD=...` を置くとローカルだけで読み込めます。`.secret.local` は Git へ含めないでください。

Rules テスト実行:

```bash
npm run test:rules
```

注意:

- `npm run test:rules` と `npm run emulators` は Java が必要です。
- システム Java が未設定でも、`.tools/jdk-*` があればラッパースクリプトがそれを自動利用します。
- このリポジトリでは `scripts/with-local-java.mjs` が Firebase Emulator 起動時にローカル JDK を補完します。
- `npm run emulators` は `scripts/run-firebase-emulators.mjs` を経由して、Windows の非 ASCII パスでも Functions Emulator が起動しやすい構成にしています。

## 管理者パスワードを Secret Manager へ登録する方法

初期確認用パスワードは `1112` ですが、ソースコードには含めていません。  
公開前に必ず変更してください。

```bash
npx firebase functions:secrets:set ADMIN_SHARED_PASSWORD
```

入力値として次を入れます。

```text
1112
```

Cloud Functions の `adminLogin` が Secret Manager 上の `ADMIN_SHARED_PASSWORD` を参照し、成功時に `admin: true` のカスタムクレーム付きカスタムトークンを返します。  
クライアントは `signInWithCustomToken` と `browserSessionPersistence` で管理セッションを開始します。

## Firestore Rules のデプロイ方法

```bash
npm run deploy:rules
```

## Cloud Functions のデプロイ方法

```bash
npm run deploy:functions
```

## Hosting への公開方法

```bash
npm run build
npm run deploy:hosting
```

## テスト方法

フロントエンドと共有ロジックのテスト:

```bash
npm run test
```

Firestore Rules テスト:

```bash
npm run test:rules
```

## ビルド方法

型チェック:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

フロントエンドのみ:

```bash
npm run build:app
```

Functions のみ:

```bash
npm --prefix functions run build
```

全体ビルド:

```bash
npm run build
```

## GitHub へコミットしてはいけないファイル

- `.env`
- `.env.local`
- Firebase の実認証情報
- Secret Manager の値
- ローカル生成ログ
- `coverage/`
- `firebase-debug.log`

## サンプルデータの削除方法

- Firebase 未設定時は `src/lib/sample-data.ts` のサンプルが表示されます。
- 実運用では Firebase を設定すると Firestore の公開データが優先されます。
- 管理画面から抽選候補者は削除できます。
- 活動予定と部員のサンプルは、実 Firebase データへ切り替える運用を推奨します。

## デプロイ前の重要事項

- 初期パスワード `1112` は公開前に必ず変更してください。
- Firestore Rules と Cloud Functions の両方をデプロイしてください。
- `.env.local` やシークレット値は Git に含めないでください。
- 管理機能の本番確認には Firebase プロジェクト作成、Authentication 有効化、Secret 登録が必要です。
