# Gmail SMTP 設定ガイド

## 📧 Gmailアプリパスワードの設定方法

### 1. Googleアカウントの2段階認証を有効にする

1. [Googleアカウント](https://myaccount.google.com/)にアクセス
2. 「セキュリティ」をクリック
3. 「2段階認証プロセス」を有効にする

### 2. アプリパスワードを生成する

1. 「セキュリティ」→「2段階認証プロセス」をクリック
2. 「アプリパスワード」をクリック
3. 「アプリを選択」で「その他（カスタム名）」を選択
4. 名前を「emolink」などと入力
5. 「生成」をクリック
6. 表示された16文字のパスワードをコピー

### 3. 環境変数の設定

```bash
# functions/.env ファイルに設定
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

### 4. Firebase Functions での設定

```bash
# Firebase Functions に環境変数を設定
firebase functions:config:set gmail.user="your_email@gmail.com"
firebase functions:config:set gmail.app_password="your_16_character_app_password"
```

## 🔧 設定の確認

### ローカルテスト

```bash
# Functions ディレクトリで
npm run build
firebase emulators:start --only functions
```

### 本番デプロイ

```bash
# 環境変数を設定してからデプロイ
firebase deploy --only functions
```

## ⚠️ 注意事項

- アプリパスワードは機密情報です。Gitにコミットしないでください
- 本番環境では必ず環境変数として設定してください
- Gmailの送信制限（1日500通）に注意してください

## 🚀 次のステップ

1. Gmailアプリパスワードを設定
2. 環境変数を設定
3. ローカルでテスト
4. 本番環境にデプロイ
