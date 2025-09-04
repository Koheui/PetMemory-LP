# エモリンククラウド LP

## 📋 概要

エモリンククラウドのランディングページ（LP）とFirebase Functionsによるメール送信システムです。

## 🏗️ システム構成

```
LP (emolink-lp.web.app) → Firebase Functions → CMS (emolink.net)
```

## 📁 ディレクトリ構造

```
PetMemory-LP-Desktop/
├── env.example              # ルート環境変数例（Functions用）
├── src/
│   └── lp/
│       ├── .env            # LP側環境変数（実際に使用）
│       ├── env.example     # LP側環境変数例
│       ├── index.html      # LPのHTML
│       ├── js/main.js      # LPのメインJavaScript
│       └── css/main.css    # LPのスタイル
├── functions/
│   ├── .env                # Functions側環境変数
│   ├── env.example         # Functions側環境変数例
│   └── src/
│       ├── api/lpForm.ts   # フォームAPI
│       └── utils/email.ts  # メール送信機能
└── lp_dist/                # ビルド出力
```

## 🔧 環境変数設定

### 1. LP側（src/lp/）⚠️ 重要

```bash
# LP側の環境変数を設定（実際に使用される）
cd src/lp
cp env.example .env
```

**設定項目**:
- `VITE_CMS_API_BASE`: Functions APIエンドポイント
- `VITE_RECAPTCHA_SITE_KEY`: reCAPTCHAサイトキー
- `VITE_TENANT_ID`: テナントID（petmem）
- `VITE_LP_ID`: LP ID（direct）

**現在の設定値**:
```
VITE_CMS_API_BASE=https://asia-northeast1-memorylink-cms.cloudfunctions.net
VITE_RECAPTCHA_SITE_KEY=6LeCp7wrAAAAACXaot0OR0ClPJ-jeM7f17OpfkoX
VITE_TENANT_ID=petmem
VITE_LP_ID=direct
```

### 2. Functions側（functions/）

```bash
# Functions側の環境変数を設定
cd functions
cp env.example .env
```

**設定項目**:
- `DEFAULT_TENANT`: デフォルトテナントID
- `DEFAULT_LP_ID`: デフォルトLP ID
- `GMAIL_USER`: Gmailアドレス
- `GMAIL_APP_PASSWORD`: Gmailアプリパスワード
- `RECAPTCHA_SECRET_KEY`: reCAPTCHA秘密鍵

### 3. ルートディレクトリ

**注意**: ルートディレクトリの `.env` は使用しません。LP側は `src/lp/.env` を使用します。

## 🚀 開発・デプロイ

### 1. LP側のビルド・デプロイ

```bash
# LPをビルド（src/lp/.env が使用される）
cd src/lp
npm run build

# ビルド結果をコピー
cd ../..
cp -r src/lp/lp_dist/* lp_dist/

# Firebase Hostingにデプロイ
firebase deploy --only hosting:emolink-lp
```

### 2. Functions側のデプロイ

```bash
# Functionsをビルド・デプロイ
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## 📧 メール送信システム

### 送信されるメール

1. **確認メール**: "エモリンククラウド - お申し込み確認"
2. **リンクメール**: "エモリンククラウド - 想い出ページ作成のご案内"

### メールリンク形式

```
https://emolink.net/claim?rid={requestId}&tenant={tenant}&lpId={lpId}&k={claimToken}
```

## 🔗 本番環境

- **LP**: https://emolink-lp.web.app
- **Functions**: https://asia-northeast1-memorylink-cms.cloudfunctions.net
- **CMS**: https://emolink.net/claim

## 📝 開発者向けドキュメント

- `TODO-CMS-v2.1.md`: CMS開発者への引き継ぎ仕様書
- `docs/`: 詳細な技術ドキュメント

## 🛠️ 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (Vite)
- **バックエンド**: Firebase Functions (Node.js/TypeScript)
- **データベース**: Firebase Firestore
- **メール送信**: Nodemailer (Gmail SMTP)
- **認証**: reCAPTCHA v3, JWT
- **ホスティング**: Firebase Hosting

## ⚠️ 重要な注意事項

1. **LP側の環境変数**: `src/lp/.env` が実際に使用されます
2. **ルートディレクトリの .env**: 使用しません（削除済み）
3. **テナント・LPID**: `petmem` と `direct` で統一
4. **ビルド時**: `src/lp/.env` の値が反映されます
