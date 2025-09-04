# 🔒 クライアントエンジニア向けLP作成のセキュリティ設計

## 🚨 **セキュリティリスクの分析**

### **❌ 潜在的なリスク**
1. **不正なAPI呼び出し**: クライアントが任意のデータを送信
2. **レート制限回避**: 大量のリクエスト送信
3. **データ改ざん**: 偽のユーザーデータ作成
4. **リソース枯渇**: サーバーリソースの過度な消費
5. **CORS悪用**: 許可されていないドメインからのアクセス

## 🛡️ **セキュリティ設計の強化**

### **1. 厳格なOrigin検証**

#### **CORS設定の強化**
```typescript
// functions/src/index.ts
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // 許可リストの厳格な管理
    const allowedOrigins = [
      'https://lp-example-com.web.app',
      'https://lp-petmem-com.web.app',
      'https://example.com',
      'https://petmem.com',
      'https://client-a.com',      // クライアントAのドメイン
      'https://client-b.com',      // クライアントBのドメイン
      'http://localhost:3000',     // 開発環境のみ
      'http://localhost:3001'      // 開発環境のみ
    ];
    
    // 本番環境では localhost を拒否
    if (process.env.NODE_ENV === 'production' && origin?.includes('localhost')) {
      return callback(new Error('Localhost not allowed in production'));
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['POST'], // 許可するHTTPメソッドを制限
  allowedHeaders: ['Content-Type', 'Origin'] // 許可するヘッダーを制限
};
```

#### **テナント設定の厳格化**
```typescript
// functions/src/utils/config.ts
export const ORIGIN_TENANT_MAP = {
  'https://lp-example-com.web.app': { tenant: 'petmem', lpId: 'direct' },
  'https://lp-petmem-com.web.app': { tenant: 'petmem', lpId: 'partner-a' },
  'https://example.com': { tenant: 'petmem', lpId: 'direct' },
  'https://petmem.com': { tenant: 'petmem', lpId: 'main' },
  'https://client-a.com': { tenant: 'client-a', lpId: 'main' },
  'https://client-b.com': { tenant: 'client-b', lpId: 'main' },
  'http://localhost:3000': { tenant: 'petmem', lpId: 'direct' },
  'http://localhost:3001': { tenant: 'petmem', lpId: 'direct' }
};

// クライアント固有の制限
export const CLIENT_RATE_LIMITS = {
  'petmem': { maxRequestsPerHour: 1000, maxRequestsPerEmail: 5 },
  'client-a': { maxRequestsPerHour: 500, maxRequestsPerEmail: 3 },
  'client-b': { maxRequestsPerHour: 500, maxRequestsPerEmail: 3 }
};
```

### **2. 強化されたレート制限**

#### **テナント別レート制限**
```typescript
// functions/src/api/lpForm.ts
async function checkRateLimit(email: string, ip: string, tenant: string): Promise<boolean> {
  try {
    const db = admin.firestore();
    const now = Date.now();
    const hourStart = Math.floor(now / (1000 * 60 * 60)) * (1000 * 60 * 60);
    
    // テナント別の制限を取得
    const tenantLimits = CLIENT_RATE_LIMITS[tenant] || CLIENT_RATE_LIMITS['petmem'];
    
    // メールアドレス別のレート制限チェック
    const emailKey = getRateLimitKey(email, "email", tenant);
    const emailQuery = await db
      .collection("rateLimits")
      .where("key", "==", emailKey)
      .where("timestamp", ">=", new Date(hourStart))
      .get();

    if (emailQuery.size >= tenantLimits.maxRequestsPerEmail) {
      console.warn(`Rate limit exceeded for email: ${email} in tenant: ${tenant}`);
      return false;
    }

    // IP別のレート制限チェック
    const ipKey = getRateLimitKey("", "ip", ip);
    const ipQuery = await db
      .collection("rateLimits")
      .where("key", "==", ipKey)
      .where("timestamp", ">=", new Date(hourStart))
      .get();

    if (ipQuery.size >= tenantLimits.maxRequestsPerHour) {
      console.warn(`Rate limit exceeded for IP: ${ip} in tenant: ${tenant}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return false; // エラー時は拒否
  }
}
```

### **3. データ検証の強化**

#### **入力データの厳格な検証**
```typescript
// functions/src/api/lpForm.ts
function validateLpFormRequest(req: Request): LpFormRequest {
  const { email, recaptchaToken } = req.body;
  
  // 必須フィールドの検証
  if (!email || !recaptchaToken) {
    throw new Error('Missing required fields');
  }
  
  // メールアドレスの形式検証
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  // メールアドレスの長さ制限
  if (email.length > 254) {
    throw new Error('Email too long');
  }
  
  // reCAPTCHAトークンの形式検証
  if (typeof recaptchaToken !== 'string' || recaptchaToken.length < 10) {
    throw new Error('Invalid reCAPTCHA token');
  }
  
  // クライアントから送信されたテナント情報は無視
  const origin = req.get('Origin');
  const { tenant, lpId } = getTenantFromOrigin(origin);
  
  return {
    email: sanitizeInput(email),
    tenant,
    lpId,
    productType: 'acrylic', // 強制上書き
    recaptchaToken,
    source: 'lp-form'
  };
}
```

### **4. 監査ログの強化**

#### **詳細な監査ログ**
```typescript
// functions/src/utils/helpers.ts
export async function logAuditEvent(event: string, data: any, req: Request) {
  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    const auditLog = {
      event,
      tenant: data.tenant,
      lpId: data.lpId,
      emailHash: hashEmail(data.email),
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      timestamp: now,
      requestId: generateRequestId(),
      success: true,
      details: {
        recaptchaScore: data.recaptchaScore,
        rateLimitStatus: data.rateLimitStatus,
        validationErrors: data.validationErrors || []
      }
    };
    
    await db.collection('auditLogs')
      .doc(new Date().toISOString().split('T')[0])
      .collection('items')
      .add(auditLog);
      
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
```

### **5. クライアント向けドキュメント**

#### **セキュアなLP作成ガイド**
```markdown
# 🔒 セキュアなLP作成ガイド

## 📋 **必須要件**

### **1. 許可されたドメイン**
- 事前にCMS側でドメインの登録が必要
- 未登録ドメインからのアクセスは拒否

### **2. API仕様**
```javascript
// 正しいAPI呼び出し例
const response = await fetch('https://memorylink-cms.cloudfunctions.net/api/gate/lp-form', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': window.location.origin // 必須
  },
  body: JSON.stringify({
    email: userEmail,
    recaptchaToken: token
    // tenant/lpId/productTypeは送信不要（サーバ側で決定）
  })
});
```

### **3. reCAPTCHA要件**
- reCAPTCHA v3の実装必須
- スコア0.5以上が必要
- アクション名: 'lp_form'

### **4. レート制限**
- 1時間あたり500リクエストまで
- 1メールアドレスあたり3リクエストまで
- 制限超過時は429エラー

### **5. エラーハンドリング**
```javascript
if (response.status === 429) {
  // レート制限エラー
  showError('リクエストが多すぎます。しばらく時間をおいてから再試行してください。');
} else if (response.status === 403) {
  // CORSエラー
  showError('このドメインからのアクセスは許可されていません。');
} else if (!response.ok) {
  // その他のエラー
  showError('エラーが発生しました。もう一度お試しください。');
}
```

## 🚫 **禁止事項**

### **1. 不正なデータ送信**
- 偽のメールアドレス
- 大量のリクエスト送信
- 許可されていないドメインからのアクセス

### **2. セキュリティ回避**
- reCAPTCHAの無効化
- レート制限の回避
- CORS設定の変更

### **3. データ改ざん**
- テナント情報の偽装
- ユーザーデータの不正作成
- システムリソースの過度な消費
```

## 🚀 **実装手順**

### **Phase 1: セキュリティ設定の強化**
1. **CORS設定の厳格化**
2. **レート制限の強化**
3. **監査ログの詳細化**

### **Phase 2: クライアント向けドキュメント**
1. **セキュアなLP作成ガイド**
2. **API仕様書**
3. **エラーハンドリングガイド**

### **Phase 3: 監視・アラート**
1. **異常検知システム**
2. **アラート設定**
3. **自動ブロック機能**

---

*この設計で、クライアントエンジニアが安全にLPを作成できる環境を実現できます！*
