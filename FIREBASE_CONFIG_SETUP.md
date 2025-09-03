# 🔧 Firebase Functions環境変数の取得方法

## 📋 **必要な環境変数一覧**

### **1. reCAPTCHA秘密鍵**
```bash
# 設定方法
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"
```

#### **取得方法**
1. **Google reCAPTCHA管理コンソール**
   - https://www.google.com/recaptcha/admin
   - 既存のサイトキーに対応する秘密鍵を取得
   - または新しいreCAPTCHAを作成

2. **現在の設定確認**
   ```bash
   firebase functions:config:get
   ```

### **2. メール送信設定**
```bash
# 設定方法
firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"
```

#### **取得方法**
1. **Firebase Authentication**
   - Firebase Console → Authentication → Templates
   - メールテンプレートの設定

2. **SendGrid（推奨）**
   - https://sendgrid.com/
   - APIキーを取得

3. **Gmail SMTP**
   - Gmailアカウントのアプリパスワード
   - 2段階認証が必要

### **3. CORS許可リスト**
```bash
# 設定方法
firebase functions:config:set cors.allowed_origins="https://lp-example-com.web.app,https://lp-petmem-com.web.app,http://localhost:3000,http://localhost:3001"
```

#### **設定内容**
- **開発環境**: `http://localhost:3000`, `http://localhost:3001`
- **本番環境**: LPのドメイン一覧
- **クライアント環境**: クライアントのドメイン

### **4. アプリ認証URL**
```bash
# 設定方法
firebase functions:config:set app.claim_continue_url="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"
```

#### **設定内容**
- **現在のCMS URL**: `https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim`

## 🔍 **現在の設定確認方法**

### **1. 全設定の確認**
```bash
firebase functions:config:get
```

### **2. 特定の設定の確認**
```bash
firebase functions:config:get recaptcha
firebase functions:config:get email
firebase functions:config:get cors
firebase functions:config:get app
```

### **3. 設定の削除**
```bash
firebase functions:config:unset recaptcha.secret_key
firebase functions:config:unset email.service_key
```

## 🚀 **設定手順**

### **Step 1: reCAPTCHA秘密鍵の取得**
1. **Google reCAPTCHA管理コンソールにアクセス**
   - https://www.google.com/recaptcha/admin
   - Googleアカウントでログイン

2. **既存のサイトキーを確認**
   - 現在使用中のサイトキー: `6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S`
   - 対応する秘密鍵を取得

3. **新しいreCAPTCHAを作成（必要に応じて）**
   - ドメイン: `memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app`
   - タイプ: reCAPTCHA v3

### **Step 2: メール送信設定の取得**
1. **SendGridアカウント作成（推奨）**
   - https://sendgrid.com/
   - 無料プランで月12,000通まで

2. **APIキーの取得**
   - SendGrid Dashboard → Settings → API Keys
   - Full Access または Restricted Access

3. **Firebase Authentication設定**
   - Firebase Console → Authentication → Templates
   - メールテンプレートのカスタマイズ

### **Step 3: 環境変数の設定**
```bash
# プロジェクト選択
firebase use memorylink-cms

# reCAPTCHA秘密鍵
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"

# メール送信設定（SendGrid）
firebase functions:config:set email.service_key="SG.YOUR_SENDGRID_API_KEY"
firebase functions:config:set email.from_email="noreply@yourdomain.com"
firebase functions:config:set email.from_name="想い出リンク"

# CORS許可リスト
firebase functions:config:set cors.allowed_origins="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app,https://lp-example-com.web.app,https://lp-petmem-com.web.app,http://localhost:3000,http://localhost:3001"

# アプリ認証URL
firebase functions:config:set app.claim_continue_url="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"

# テナント設定
firebase functions:config:set tenants.petmem.id="petmem"
firebase functions:config:set tenants.petmem.name="PetMemory Inc."
firebase functions:config:set tenants.petmem.lp_ids="direct,partner-a,partner-b"
```

## 🔒 **セキュリティ注意事項**

### **✅ 環境変数の管理**
- **秘密鍵**: 絶対にGitにコミットしない
- **本番環境**: 本番用のキーのみ使用
- **開発環境**: テスト用のキーを使用

### **✅ 設定の確認**
```bash
# 設定の確認
firebase functions:config:get

# 出力例
{
  "recaptcha": {
    "secret_key": "6L..."
  },
  "email": {
    "service_key": "SG..."
  },
  "cors": {
    "allowed_origins": "https://..."
  },
  "app": {
    "claim_continue_url": "https://..."
  }
}
```

### **✅ 設定のバックアップ**
```bash
# 設定のエクスポート
firebase functions:config:get > firebase-config.json

# 設定のインポート
firebase functions:config:set --config-file firebase-config.json
```

## 🎯 **次のステップ**

### **即座に実行可能**
1. **reCAPTCHA秘密鍵の取得**
2. **メール送信設定の準備**
3. **基本的な環境変数の設定**

### **段階的な改善**
1. **SendGridの設定**
2. **メールテンプレートのカスタマイズ**
3. **監視・アラートの設定**

---

*この手順で、必要な環境変数を安全に取得・設定できます！*
