# 🔧 Gmail SMTP設定ガイド

## 📧 **SendGridを使わないメール送信方法**

### **✅ Gmail SMTPのメリット**
- **無料で利用可能**
- **信頼性が高い**
- **設定が簡単**
- **Firebase Functionsと相性が良い**

## 🔧 **設定手順**

### **Step 1: Gmailアプリパスワードの作成**

#### **1. Googleアカウント設定**
1. **Googleアカウント** → **セキュリティ**
2. **2段階認証を有効化**
3. **アプリパスワード** → **メール** → **生成**

#### **2. アプリパスワードの取得**
- **アプリ**: `メール`
- **デバイス**: `その他（カスタム名）`
- **名前**: `PetMemory LP`

### **Step 2: Firebase Functions環境変数設定**

```bash
# プロジェクト選択
firebase use memorylink-cms

# Gmail SMTP設定
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"

# reCAPTCHA秘密鍵設定
firebase functions:config:set recaptcha.secret_key="6LeCp7wrAAAAAM1K4gACYYkilZMuVuSGG-qRI-FH"

# CORS許可リスト
firebase functions:config:set cors.allowed_origins="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app,https://lp-example-com.web.app,https://lp-petmem-com.web.app,http://localhost:3000,http://localhost:3001"

# アプリ認証URL
firebase functions:config:set app.claim_continue_url="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"

# テナント設定
firebase functions:config:set tenants.petmem.id="petmem"
firebase functions:config:set tenants.petmem.name="PetMemory Inc."
firebase functions:config:set tenants.petmem.lp_ids="direct,partner-a,partner-b"
```

### **Step 3: 設定の確認**

```bash
# 設定の確認
firebase functions:config:get

# 出力例
{
  "email": {
    "user": "your-email@gmail.com",
    "password": "your-app-password"
  },
  "recaptcha": {
    "secret_key": "6LeCp7wrAAAAAM1K4gACYYkilZMuVuSGG-qRI-FH"
  },
  "cors": {
    "allowed_origins": "https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app,https://lp-example-com.web.app,https://lp-petmem-com.web.app,http://localhost:3000,http://localhost:3001"
  },
  "app": {
    "claim_continue_url": "https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"
  },
  "tenants": {
    "petmem": {
      "id": "petmem",
      "name": "PetMemory Inc.",
      "lp_ids": "direct,partner-a,partner-b"
    }
  }
}
```

## 🚀 **実装完了項目**

### **✅ コード更新（完了）**
- **Firebase Functions**: Gmail SMTP実装
- **型定義**: 環境変数型の追加
- **package.json**: nodemailer依存関係の追加
- **メールテンプレート**: 美しいHTMLメールテンプレート

### **✅ メールテンプレート機能**
- **レスポンシブデザイン**
- **ブランドカラー適用**
- **セキュリティリンク**
- **フォールバックURL**

## 🔒 **セキュリティ注意事項**

### **✅ アプリパスワードの保護**
- **絶対にGitにコミットしない**
- **定期的な更新を検討**
- **不要なアプリパスワードは削除**

### **✅ メール送信制限**
- **Gmail: 1日500通制限**
- **レート制限の実装済み**
- **スパム対策の実装**

### **✅ 環境変数の管理**
- **Firebase Functions Config使用**
- **本番環境でのみ設定**
- **開発環境ではモック使用**

## 🧪 **テスト手順**

### **Phase 1: ローカルテスト**
```bash
# 依存関係のインストール
cd functions
npm install

# ビルド
npm run build

# ローカルテストサーバー起動
npm run serve
```

### **Phase 2: 本番デプロイ**
```bash
# 本番環境にデプロイ
firebase deploy --only functions

# ログの確認
firebase functions:log
```

### **Phase 3: 統合テスト**
1. **LP側のフォーム送信**
2. **reCAPTCHA動作確認**
3. **メール送信確認**
4. **認証リンク動作確認**

## 📧 **メール送信フロー**

### **1. LPフォーム送信**
```
LP → reCAPTCHA → CMS Functions
```

### **2. メール送信処理**
```
CMS Functions → Gmail SMTP → ユーザーメール
```

### **3. 認証フロー**
```
ユーザー → メールリンク → CMS認証 → アプリ
```

---

*Gmail SMTPで、安全で信頼性の高いメール送信システムを構築しました！*
