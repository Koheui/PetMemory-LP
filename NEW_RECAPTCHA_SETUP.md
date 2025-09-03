# 🔧 新しいreCAPTCHAキー設定

## 📋 **新しいreCAPTCHAキー**
- **サイトキー**: `6LeCp7wrAAAAACXaot0OR0ClPJ-jeM7f17OpfkoX`
- **シークレットキー**: `6LeCp7wrAAAAAM1K4gACYYkilZMuVuSGG-qRI-FH`

## 🔧 **設定の更新**

### **1. LP側の更新（完了）**
```javascript
// src/lp/index.html
window.VITE_RECAPTCHA_SITE_KEY = '6LeCp7wrAAAAACXaot0OR0ClPJ-jeM7f17OpfkoX';
```

### **2. CMS側の環境変数設定**
```bash
# プロジェクト選択
firebase use memorylink-cms

# reCAPTCHA秘密鍵設定
firebase functions:config:set recaptcha.secret_key="6LeCp7wrAAAAAM1K4gACYYkilZMuVuSGG-qRI-FH"

# その他の環境変数設定
firebase functions:config:set cors.allowed_origins="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app,https://lp-example-com.web.app,https://lp-petmem-com.web.app,http://localhost:3000,http://localhost:3001"

firebase functions:config:set app.claim_continue_url="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"

firebase functions:config:set tenants.petmem.id="petmem"
firebase functions:config:set tenants.petmem.name="PetMemory Inc."
firebase functions:config:set tenants.petmem.lp_ids="direct,partner-a,partner-b"
```

### **3. 設定の確認**
```bash
# 設定の確認
firebase functions:config:get

# 出力例
{
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

## 🚀 **次のステップ**

### **Phase 1: 環境変数の設定**
1. **CMS側の環境変数設定**
2. **設定の確認**
3. **基本的なテスト**

### **Phase 2: メール送信設定**
1. **SendGridアカウント作成**
2. **APIキーの取得**
3. **メール送信設定**

### **Phase 3: 統合テスト**
1. **LP → CMS連携テスト**
2. **reCAPTCHA動作確認**
3. **メール送信テスト**

## 🔒 **セキュリティ注意事項**

### **✅ 秘密鍵の保護**
- **絶対にGitにコミットしない**
- **本番環境でのみ使用**
- **定期的な更新を検討**

### **✅ ドメイン設定**
- **reCAPTCHA管理コンソールでドメインを追加**
- **開発環境と本番環境の分離**
- **許可されたドメインのみアクセス**

---

*新しいreCAPTCHAキーで、安全で効率的なLP-CMS連携を実現できます！*
