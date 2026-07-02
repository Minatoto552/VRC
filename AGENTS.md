# AGENTS.md

## 目的

このリポジトリは、VRChat 向け「2026年3月同期会 Event Cafe」の公開サイトと運営用管理サイトを管理します。  
公開ページはスマートフォン優先、管理画面は Firebase ベースで運用します。

## 技術方針

- フロントエンドは React + TypeScript + Vite
- バックエンドは Firebase Cloud Functions v2
- データストアは Cloud Firestore
- 管理画面の認証は Secret Manager + custom token
- TypeScript は strict 寄りを維持する
- `any` は極力使わない

## ディレクトリ構成

- `src/`: フロントエンド
- `src/pages/`: ページ単位の UI
- `src/components/`: 共通 UI
- `src/lib/`: Firebase 接続、API、整形処理
- `shared/`: フロントと Functions で共有する型とバリデーション
- `functions/`: Cloud Functions
- `tests/`: Firestore Rules テスト

## デザインルール

- 既存の温かいカフェ調デザインを維持する
- 木目ブラウン、アイボリー、ベージュ、深緑、くすんだオレンジ、えんじ系を優先する
- 色だけで状態を表現しない
- フォームエラーは文章で出す
- 長い VRC 名でもレイアウトを崩さない
- ボタンはスマートフォンで押しやすいサイズを保つ

## セキュリティルール

- 管理者パスワードをソースコードへ直接書かない
- Secret Manager の `ADMIN_SHARED_PASSWORD` を使う
- 管理権限は `request.auth.token.admin == true` を基準にする
- 抽選候補者の Firestore 直接書き込みは許可しない
- 管理機能は Cloud Functions または Security Rules で保護する

## 実行コマンド

依存インストール:

```bash
npm install
npm --prefix functions install
```

開発サーバー:

```bash
npm run dev
```

型チェック:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

フロントエンドテスト:

```bash
npm run test
```

Firestore Rules テスト:

```bash
npm run test:rules
```

フロントエンドビルド:

```bash
npm run build:app
```

Functions ビルド:

```bash
npm --prefix functions run build
```

フルビルド:

```bash
npm run build
```

## テスト方針

- `shared/` のバリデーションと抽選ロジックは unit test を維持する
- 重要画面は component test を追加する
- Firestore Rules は `tests/firestore.rules.test.ts` に追加する
- Emulator を使う Rules テストには Java が必要

## 運用メモ

- 公開向けデータは Firestore 上の公開レコードを使う
- Firebase 未設定時は `sample-data.ts` のサンプル表示を許容する
- GitHub へ反映する際は `.env.local` やシークレット値をコミットしない
- 既存完成物を上書きしない
- GitHub へ保存する場合は新しい専用ブランチを優先する
