# 🔗 LP-CMS連携設計書

## 📊 **現在の状況**

### **✅ CMS側（既存）**
- **API エンドポイント**: `/api/gate/lp-form`
- **認証フロー**: メールリンク認証
- **データ構造**: `claimRequests`, `memories`, `publicPages`
- **セキュリティ**: reCAPTCHA, レート制限, テナント分離

### **✅ LP側（現在の実装）**
- **フォーム**: メールアドレス入力
- **reCAPTCHA**: 実装済み
- **API連携**: 基本的な送信処理

## 🔄 **連携フロー**

### **1. LP → CMS 連携**
```
LP (サインアップフォーム)
    ↓
POST /api/gate/lp-form
{
  email: "user@example.com",
  tenant: "petmem",
  lpId: "direct",
  productType: "acrylic",
  recaptchaToken: "..."
}
    ↓
CMS (Functions)
├── reCAPTCHA検証
├── レート制限チェック
├── claimRequests作成
├── 認証メール送信
└── 成功レスポンス
```

### **2. メール認証フロー**
```
ユーザーがメール内のリンクをクリック
    ↓
https://app.example.com/claim?rid=...&tenant=...&lpId=...
    ↓
CMS (アプリ側)
├── signInWithEmailLink
├── 4点突合検証
├── memories作成
├── publicPageId付与
└── ダッシュボード表示
```

## 🔧 **実装詳細**

### **1. LP側の実装**

#### **現在の実装状況**
```javascript
// src/lp/js/main-complete.js
const submitToAPI = async (email, recaptchaToken) => {
  const response = await fetch('/api-gate-lp-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      recaptchaToken: recaptchaToken
    })
  });
  
  return response.json();
};
```

#### **必要な修正**
```javascript
// 修正後のAPI呼び出し
const submitToAPI = async (email, recaptchaToken) => {
  const response = await fetch('https://memorylink-cms.cloudfunctions.net/api/gate/lp-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': window.location.origin
    },
    body: JSON.stringify({
      email: email,
      tenant: window.VITE_TENANT_ID,
      lpId: window.VITE_LP_ID,
      productType: 'acrylic',
      recaptchaToken: recaptchaToken
    })
  });
  
  return response.json();
};
```

### **2. CMS側の設定**

#### **CORS設定**
```typescript
// functions/src/index.ts
const corsOptions = {
  origin: [
    'https://lp-example-com.web.app',
    'https://lp-petmem-com.web.app',
    'https://example.com',
    'https://petmem.com',
    'http://localhost:3000', // 開発用
    'http://localhost:3001'   // 開発用
  ],
  credentials: true
};
```

#### **テナント設定**
```typescript
// functions/src/utils/config.ts
export const ALLOWED_TENANTS = {
  'petmem': ['direct', 'partner-a', 'partner-b'],
  'client-a': ['main', 'campaign-1'],
  'client-b': ['main', 'special-offer']
};
```

### **3. 環境変数設定**

#### **LP側の環境変数**
```bash
# .env
VITE_CMS_API_BASE=https://memorylink-cms.cloudfunctions.net
VITE_RECAPTCHA_SITE_KEY=6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S
VITE_TENANT_ID=petmem
VITE_LP_ID=direct
```

#### **CMS側の環境変数**
```bash
# Firebase Functions環境変数
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"
firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"
firebase functions:config:set cors.allowed_origins="https://lp-example-com.web.app,https://lp-petmem-com.web.app"
```

## 🚀 **実装手順**

### **Phase 1: LP側の修正**
1. **APIエンドポイントの修正**
   - 本番CMSのURLに変更
   - 必要なパラメータの追加

2. **環境変数の設定**
   - 本番環境の設定
   - テナント情報の設定

3. **エラーハンドリングの改善**
   - CMSからのエラーレスポンス対応
   - ユーザーフレンドリーなメッセージ

### **Phase 2: CMS側の設定**
1. **CORS設定の更新**
   - LPドメインの許可リスト追加
   - 開発環境の設定

2. **テナント設定の確認**
   - 新しいテナントの追加
   - LP IDの設定

3. **環境変数の設定**
   - reCAPTCHA秘密鍵
   - メール送信設定

### **Phase 3: 統合テスト**
1. **エンドツーエンドテスト**
   - LP → CMS → メール送信 → 認証
   - エラーケースのテスト

2. **セキュリティテスト**
   - reCAPTCHA検証
   - レート制限
   - CORS設定

3. **パフォーマンステスト**
   - レスポンス時間
   - 同時アクセス

## 🔧 **具体的な修正内容**

### **1. LP側の修正**

#### **APIエンドポイントの変更**
```javascript
// src/lp/js/main-complete.js の修正
const API_BASE_URL = window.VITE_CMS_API_BASE || 'https://memorylink-cms.cloudfunctions.net';

const submitToAPI = async (email, recaptchaToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gate/lp-form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify({
        email: email,
        tenant: window.VITE_TENANT_ID,
        lpId: window.VITE_LP_ID,
        productType: 'acrylic',
        recaptchaToken: recaptchaToken
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};
```

#### **エラーハンドリングの改善**
```javascript
// エラーメッセージの改善
const handleFormSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // ... 既存の処理 ...
    
    const result = await submitToAPI(email, recaptchaToken);
    
    if (result.success) {
      showSuccess('認証メールを送信しました。メールをご確認ください。');
    } else {
      showError(result.error || 'エラーが発生しました。');
    }
  } catch (error) {
    if (error.message.includes('rate limit')) {
      showError('リクエストが多すぎます。しばらく時間をおいてから再試行してください。');
    } else if (error.message.includes('recaptcha')) {
      showError('reCAPTCHAの検証に失敗しました。ページを再読み込みしてください。');
    } else {
      showError('ネットワークエラーが発生しました。インターネット接続をご確認ください。');
    }
  }
};
```

### **2. CMS側の設定**

#### **CORS設定の更新**
```typescript
// functions/src/index.ts
import cors from 'cors';

const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    const allowedOrigins = [
      'https://lp-example-com.web.app',
      'https://lp-petmem-com.web.app',
      'https://example.com',
      'https://petmem.com',
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

app.use(cors(corsOptions));
```

## 🎯 **次のステップ**

### **即座に実行可能**
1. **LP側のAPIエンドポイント修正**
2. **環境変数の設定**
3. **基本的な統合テスト**

### **段階的な改善**
1. **エラーハンドリングの強化**
2. **セキュリティ設定の最適化**
3. **パフォーマンスの改善**

---

*この設計で、既存のCMSとLPを効率的に連携できます！*
