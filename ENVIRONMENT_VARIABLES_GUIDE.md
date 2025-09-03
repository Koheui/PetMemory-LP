# 🔧 環境変数設定ガイド

## 📊 **現在の設定状況**

### **✅ LP側の環境変数**

#### **現在の設定（src/lp/index.html）**
```javascript
window.VITE_CMS_API_BASE = 'http://localhost:5001';           // 開発用
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';  // 本番キー
window.VITE_TENANT_ID = 'petmem';                            // テナントID
window.VITE_LP_ID = 'direct';                               // LP ID
```

#### **推奨設定**

**開発環境用**
```javascript
window.VITE_CMS_API_BASE = 'http://localhost:5001';           // モックサーバー
window.VITE_RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';  // テストキー
window.VITE_TENANT_ID = 'petmem';
window.VITE_LP_ID = 'direct';
```

**本番環境用**
```javascript
window.VITE_CMS_API_BASE = 'https://memorylink-cms.cloudfunctions.net';  // 本番CMS
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';  // 本番キー
window.VITE_TENANT_ID = 'petmem';
window.VITE_LP_ID = 'direct';
```

### **✅ CMS側の環境変数**

#### **必要な設定**
```bash
# reCAPTCHA秘密鍵
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"

# メール送信設定
firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"

# CORS許可リスト
firebase functions:config:set cors.allowed_origins="https://lp-example-com.web.app,https://lp-petmem-com.web.app,https://example.com,https://petmem.com"

# アプリ認証URL
firebase functions:config:set app.claim_continue_url="https://app.example.com/claim"

# テナント設定
firebase functions:config:set tenants.petmem.id="petmem"
firebase functions:config:set tenants.petmem.name="PetMemory Inc."
firebase functions:config:set tenants.petmem.lp_ids="direct,partner-a,partner-b"
```

## 🔧 **環境別設定**

### **開発環境**
```bash
# .env.development
VITE_CMS_API_BASE=http://localhost:5001
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
VITE_TENANT_ID=petmem
VITE_LP_ID=direct
```

### **ステージング環境**
```bash
# .env.staging
VITE_CMS_API_BASE=https://staging-memorylink-cms.cloudfunctions.net
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
VITE_TENANT_ID=petmem
VITE_LP_ID=direct
```

### **本番環境**
```bash
# .env.production
VITE_CMS_API_BASE=https://memorylink-cms.cloudfunctions.net
VITE_RECAPTCHA_SITE_KEY=6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S
VITE_TENANT_ID=petmem
VITE_LP_ID=direct
```

## 🚀 **設定手順**

### **Phase 1: 開発環境の設定**
1. **モックサーバーの確認**
   ```bash
   node test-server.js
   ```

2. **LP側の環境変数確認**
   ```bash
   npm run dev
   ```

3. **基本的な連携テスト**
   - フォーム送信テスト
   - reCAPTCHA動作確認

### **Phase 2: 本番環境の設定**
1. **CMS側の環境変数設定**
   ```bash
   firebase use memorylink-cms
   firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"
   firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"
   ```

2. **LP側の環境変数更新**
   ```javascript
   window.VITE_CMS_API_BASE = 'https://memorylink-cms.cloudfunctions.net';
   ```

3. **CORS設定の確認**
   ```typescript
   const allowedOrigins = [
     'https://lp-example-com.web.app',
     'https://lp-petmem-com.web.app',
     'https://example.com',
     'https://petmem.com'
   ];
   ```

### **Phase 3: 統合テスト**
1. **エンドツーエンドテスト**
   - LP → CMS → メール送信 → 認証

2. **セキュリティテスト**
   - reCAPTCHA検証
   - CORS設定
   - レート制限

3. **パフォーマンステスト**
   - レスポンス時間
   - 同時アクセス

## 🔒 **セキュリティ注意事項**

### **✅ 環境変数の管理**
- **開発環境**: テストキーを使用
- **本番環境**: 本番キーのみ使用
- **秘密鍵**: 絶対にクライアント側に露出しない

### **✅ 本番環境の準備**
- **reCAPTCHA秘密鍵**: 本番環境で設定
- **メール送信設定**: 本番環境で設定
- **CORS設定**: 本番ドメインのみ許可

### **✅ 監視・ログ**
- **環境変数の変更**: 監査ログに記録
- **設定の確認**: 定期的な確認
- **バックアップ**: 設定のバックアップ

## 🎯 **次のステップ**

### **即座に実行可能**
1. **開発環境のreCAPTCHAキー修正**
2. **本番CMSのURL確認**
3. **基本的な連携テスト**

### **段階的な改善**
1. **環境別設定ファイルの作成**
2. **自動化スクリプトの作成**
3. **監視・アラートの設定**

---

*この設定で、安全で効率的な環境変数管理が実現できます！*
