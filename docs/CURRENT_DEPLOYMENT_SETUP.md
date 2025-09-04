# 🔧 現在のデプロイ状況に基づく環境変数設定

## 📊 **現在のデプロイ状況**

### **✅ CMS側（稼働中）**
- **URL**: `https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/`
- **リージョン**: `asia-east1`
- **プロジェクト**: `memorylink-cms`
- **状態**: 稼働中

### **✅ LP側（開発中）**
- **開発環境**: `http://localhost:3000`
- **モックサーバー**: `http://localhost:5001`
- **状態**: 開発・テスト中

## 🔧 **環境変数の更新**

### **1. LP側の環境変数更新**

#### **開発環境用（現在の設定）**
```javascript
// src/lp/index.html
window.VITE_CMS_API_BASE = 'http://localhost:5001';           // モックサーバー
window.VITE_RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';  // テストキー
window.VITE_TENANT_ID = 'petmem';
window.VITE_LP_ID = 'direct';
```

#### **本番環境用（新しい設定）**
```javascript
// 本番環境用
window.VITE_CMS_API_BASE = 'https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app';
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';  // 本番キー
window.VITE_TENANT_ID = 'petmem';
window.VITE_LP_ID = 'direct';
```

### **2. CMS側の環境変数設定**

#### **Firebase Functions環境変数**
```bash
# プロジェクト選択
firebase use memorylink-cms

# reCAPTCHA秘密鍵
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"

# メール送信設定
firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"

# CORS許可リスト（現在のデプロイURLを含む）
firebase functions:config:set cors.allowed_origins="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app,https://lp-example-com.web.app,https://lp-petmem-com.web.app,http://localhost:3000,http://localhost:3001"

# アプリ認証URL
firebase functions:config:set app.claim_continue_url="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"

# テナント設定
firebase functions:config:set tenants.petmem.id="petmem"
firebase functions:config:set tenants.petmem.name="PetMemory Inc."
firebase functions:config:set tenants.petmem.lp_ids="direct,partner-a,partner-b"
```

## 🚀 **実装手順**

### **Phase 1: 開発環境の確認**
1. **モックサーバーの動作確認**
   ```bash
   node test-server.js
   ```

2. **LP側の開発環境確認**
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
   // 本番環境用に更新
   window.VITE_CMS_API_BASE = 'https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app';
   ```

3. **CORS設定の確認**
   ```typescript
   const allowedOrigins = [
     'https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app',
     'https://lp-example-com.web.app',
     'https://lp-petmem-com.web.app',
     'http://localhost:3000',
     'http://localhost:3001'
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

## 🔒 **セキュリティ設定**

### **✅ CORS設定**
```typescript
// functions/src/index.ts
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    const allowedOrigins = [
      'https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app',
      'https://lp-example-com.web.app',
      'https://lp-petmem-com.web.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

### **✅ テナント設定**
```typescript
// functions/src/utils/config.ts
export const ALLOWED_TENANTS = {
  'petmem': ['direct', 'partner-a', 'partner-b'],
  'client-a': ['main', 'campaign-1'],
  'client-b': ['main', 'special-offer']
};

export const ORIGIN_TENANT_MAP = {
  'https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app': { tenant: 'petmem', lpId: 'direct' },
  'https://lp-example-com.web.app': { tenant: 'petmem', lpId: 'direct' },
  'https://lp-petmem-com.web.app': { tenant: 'petmem', lpId: 'partner-a' },
  'http://localhost:3000': { tenant: 'petmem', lpId: 'direct' },
  'http://localhost:3001': { tenant: 'petmem', lpId: 'direct' }
};
```

## 🎯 **次のステップ**

### **即座に実行可能**
1. **LP側の環境変数更新**
2. **CMS側のCORS設定確認**
3. **基本的な連携テスト**

### **段階的な改善**
1. **本番環境の環境変数設定**
2. **セキュリティ設定の最適化**
3. **パフォーマンスの改善**

### **将来の改善**
1. **カスタムドメインの取得**
2. **SSL証明書の設定**
3. **CDNの導入**

---

*現在のデプロイ状況に合わせて、効率的なLP-CMS連携を実現できます！*
