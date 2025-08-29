# 想い出リンク LP

ペット向け想い出サービスのランディングページ

## 概要

このプロジェクトは、ペットとの想い出を残すための「NFCタグ付きアクリルスタンド」と「想い出ページ」を提供するサービスのLPです。

### 特徴

- **レスポンシブデザイン**: モバイルファーストのデザイン
- **パスワードレス認証**: Firebase Auth のメールリンク認証
- **セキュリティ**: reCAPTCHA v3、CORS、レート制限
- **マルチテナント対応**: 複数のパートナー企業に対応

## 技術スタック

- **フロントエンド**: HTML5, CSS3, TypeScript/JavaScript
- **バックエンド**: Firebase Functions (Node.js/TypeScript)
- **データベース**: Cloud Firestore
- **認証**: Firebase Auth
- **ホスティング**: Firebase Hosting
- **セキュリティ**: reCAPTCHA v3

## プロジェクト構造

```
PetMemory-LP/
├── src/lp/                 # LP のソースファイル
│   ├── index.html          # メインHTML
│   ├── css/main.css        # スタイルシート
│   ├── js/main.js          # JavaScript
│   └── assets/             # 画像・アイコン
├── functions/              # Firebase Functions
│   ├── src/                # TypeScript ソース
│   ├── package.json        # 依存関係
│   └── tsconfig.json       # TypeScript設定
├── firebase.json           # Firebase設定
├── firestore.rules         # Firestoreセキュリティルール
├── firestore.indexes.json  # Firestoreインデックス
└── package.json            # プロジェクト設定
```

## セットアップ

### 1. 依存関係のインストール

```bash
# プロジェクトルート
npm install

# Functions
cd functions
npm install
```

### 2. Firebase プロジェクトの設定

```bash
# Firebase CLI のインストール
npm install -g firebase-tools

# Firebase にログイン
firebase login

# プロジェクトの初期化
firebase init
```

### 3. 環境変数の設定

Firebase Functions の環境変数を設定:

```bash
firebase functions:config:set \
  recaptcha.secret="YOUR_RECAPTCHA_SECRET" \
  app.claim_continue_url="https://app.example.com/claim" \
  cors.allowed_origins="https://lp.example.com"
```

### 4. reCAPTCHA の設定

1. [Google reCAPTCHA](https://www.google.com/recaptcha/) でサイトキーを取得
2. `src/lp/index.html` の `YOUR_SITE_KEY` を実際のサイトキーに置き換え
3. Functions の環境変数に Secret Key を設定

## 開発

### ローカル開発

```bash
# LP の開発サーバー
npm run start

# Functions のローカルエミュレータ
cd functions
npm run serve
```

### ビルド

```bash
# LP のビルド
npm run build:lp

# Functions のビルド
npm run build:functions

# 全体ビルド
npm run build
```

## デプロイ

### 1. LP のデプロイ

```bash
# ビルド
npm run build:lp

# Hosting のみデプロイ
firebase deploy --only hosting
```

### 2. Functions のデプロイ

```bash
# Functions のビルド
cd functions
npm run build

# Functions のみデプロイ
firebase deploy --only functions
```

### 3. 全体デプロイ

```bash
# 全体ビルド & デプロイ
npm run build
firebase deploy
```

## API エンドポイント

### POST /api/gate/lp-form

LP フォームからの申し込みを処理

**リクエスト:**
```json
{
  "email": "user@example.com",
  "tenant": "petmem",
  "lpId": "direct",
  "productType": "acrylic",
  "recaptchaToken": "..."
}
```

**レスポンス:**
```json
{
  "ok": true,
  "message": "メールを送信しました。受信ボックスをご確認ください。",
  "data": {
    "requestId": "..."
  }
}
```

## セキュリティ

- **reCAPTCHA v3**: ボット対策
- **CORS**: オリジン制限
- **レート制限**: IP・メールアドレス別制限
- **入力サニタイゼーション**: XSS対策
- **Firestore Rules**: データアクセス制御

## 監視・ログ

- **監査ログ**: 全ての重要操作をFirestoreに記録
- **エラーログ**: Functions のログを Cloud Logging で監視
- **パフォーマンス**: Firebase Performance Monitoring

## トラブルシューティング

### よくある問題

1. **メールが届かない**
   - Firebase Auth の設定を確認
   - SPF/DMARC の設定を確認
   - 迷惑メールフォルダを確認

2. **CORS エラー**
   - 環境変数 `CORS_ALLOWED_ORIGINS` を確認
   - ドメインの設定を確認

3. **reCAPTCHA エラー**
   - サイトキーとシークレットキーを確認
   - ドメインの登録を確認

### ログの確認

```bash
# Functions のログ
firebase functions:log

# 特定の Function のログ
firebase functions:log --only api
```

## ライセンス

MIT License

## サポート

技術的な問題については、開発チームまでお問い合わせください。
