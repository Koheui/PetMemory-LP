# 📊 LP-CMS間データ参照仕様書

## 🔄 **データフロー詳細**

### **1. LP → CMS（送信データ）**

#### **LP側から送信されるデータ**
```javascript
{
  email: "user@example.com",           // 必須：ユーザーのメールアドレス
  tenant: "petmem",                    // 送信するが無視される
  lpId: "direct",                      // 送信するが無視される
  productType: "acrylic",             // 送信するが無視される
  recaptchaToken: "..."                // 必須：reCAPTCHAトークン
}
```

#### **CMS側での処理**
```typescript
// 1. Origin検証
const origin = req.get('Origin');
const allowedOrigins = [
  'https://lp-example-com.web.app',
  'https://lp-petmem-com.web.app',
  'https://example.com',
  'https://petmem.com'
];

if (!allowedOrigins.includes(origin)) {
  return res.status(403).json({ error: 'Origin not allowed' });
}

// 2. テナント情報の解決（Originベース）
const tenantConfig = {
  'https://lp-example-com.web.app': { tenant: 'petmem', lpId: 'direct' },
  'https://lp-petmem-com.web.app': { tenant: 'petmem', lpId: 'partner-a' },
  'https://example.com': { tenant: 'petmem', lpId: 'direct' },
  'https://petmem.com': { tenant: 'petmem', lpId: 'main' }
};

const { tenant, lpId } = tenantConfig[origin] || { tenant: 'default', lpId: 'default' };

// 3. claimRequests作成
const claimRequest = {
  email: req.body.email,
  tenant: tenant,                    // サーバ側で解決した値
  lpId: lpId,                       // サーバ側で解決した値
  productType: 'acrylic',           // 強制上書き
  source: 'lp-form',
  status: 'pending',
  sentAt: admin.firestore.Timestamp.now(),
  emailHash: hashEmail(req.body.email)
};

await db.collection('claimRequests').add(claimRequest);
```

### **2. CMS → LP（レスポンスデータ）**

#### **成功時のレスポンス**
```javascript
{
  success: true,
  message: "認証メールを送信しました。メールをご確認ください。",
  requestId: "auto-generated-id"
}
```

#### **エラー時のレスポンス**
```javascript
{
  success: false,
  error: "エラーメッセージ",
  code: "ERROR_CODE"
}
```

### **3. メール認証フロー**

#### **認証リンクの構造**
```
https://app.example.com/claim?rid={requestId}&tenant={tenant}&lpId={lpId}
```

#### **認証時の4点突合**
```typescript
// 1. 認証リンクの検証
const { rid, tenant, lpId } = req.query;

// 2. claimRequestsの取得
const claimRequest = await db.collection('claimRequests').doc(rid).get();

// 3. 4点突合検証
const isValid = 
  claimRequest.exists &&
  claimRequest.data().email === auth.email &&
  claimRequest.data().tenant === tenant &&
  claimRequest.data().lpId === lpId &&
  claimRequest.data().status === 'pending';

if (!isValid) {
  return res.status(400).json({ error: 'Invalid claim request' });
}

// 4. memories作成
const memory = {
  ownerUid: auth.uid,
  tenant: tenant,
  lpId: lpId,
  title: '新しい想い出',
  type: 'pet',
  status: 'draft',
  createdAt: admin.firestore.Timestamp.now(),
  updatedAt: admin.firestore.Timestamp.now()
};

const memoryRef = await db.collection('memories').add(memory);

// 5. publicPageId付与
const publicPageId = generatePublicPageId();
await memoryRef.update({ publicPageId: publicPageId });

// 6. claimRequests更新
await claimRequest.ref.update({ 
  status: 'claimed',
  claimedAt: admin.firestore.Timestamp.now()
});
```

## 📊 **データ参照の権限**

### **✅ LP側の権限**
- **読み取り**: なし（静的サイト）
- **書き込み**: なし（API経由のみ）
- **実行**: `/api/gate/lp-form` の呼び出しのみ

### **✅ CMS側の権限**
- **claimRequests**: Functionsのみ書き込み可能
- **memories**: 認証済みユーザーのみ
- **publicPages**: 読み取りは公開、書き込みはFunctionsのみ
- **orders**: Functionsのみ書き込み可能

### **✅ テナント分離ルール**
```typescript
// すべての主要ドキュメントに tenant（必須）と lpId を保持
// Functions 側で ホワイトリスト検証（ALLOWED_TENANTS[tenant].includes(lpId)）
// /claim で 4点突合：auth.email === claimRequests.email かつ tenant/lpId 一致 かつ rid 有効
```

## 🔧 **実装時の注意点**

### **1. セキュリティ**
- **Origin検証**: 必須
- **クライアント値無視**: tenant/lpId/productType
- **reCAPTCHA検証**: 必須
- **レート制限**: 実装済み

### **2. データ整合性**
- **テナント分離**: 完全分離
- **4点突合**: 厳格な検証
- **監査ログ**: 全重要イベント記録

### **3. エラーハンドリング**
- **ユーザーフレンドリー**: 分かりやすいエラーメッセージ
- **ログ記録**: 詳細なエラーログ
- **フォールバック**: 適切なフォールバック処理

## 🚀 **実装手順**

### **Phase 1: 基本連携**
1. **LP側のAPI呼び出し修正**
2. **CMS側のCORS設定**
3. **基本的なエンドツーエンドテスト**

### **Phase 2: セキュリティ強化**
1. **Origin検証の実装**
2. **テナント分離の確認**
3. **エラーハンドリングの改善**

### **Phase 3: 運用準備**
1. **監査ログの設定**
2. **監視・アラートの設定**
3. **ドキュメントの整備**

---

*この仕様に従って、安全で効率的なLP-CMS連携を実現できます！*
