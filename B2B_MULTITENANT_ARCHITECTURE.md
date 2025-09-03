# 🏢 BtoBマルチテナント対応アーキテクチャ設計

## 🎯 **BtoB要件の分析**

### **自社運営LP**
- 完全な制御権
- 統一されたブランディング
- 直接的なデータアクセス

### **BtoB他社LP**
- **ブランディングの完全分離**
- **データの完全分離**
- **カスタマイズ性の確保**
- **セキュリティの分離**
- **独立した運用管理**

## 🏗️ **推奨アーキテクチャ: ハイブリッド分離型**

### **設計方針**
- **自社LP**: 統合型（単一リポジトリ）
- **BtoB LP**: 分散型（個別リポジトリ）
- **共通基盤**: 既存CMSを活用

## 📊 **アーキテクチャ構成**

```
自社LP管理 (PetMemory-LP)
├── src/
│   ├── lp/                    # 自社LP1
│   ├── lp-petmem/             # 自社LP2
│   └── shared/                # 自社共通コンポーネント
├── functions/                  # 自社LP専用API
└── firebase.json              # 自社LP設定

BtoB LP管理 (個別リポジトリ)
├── client-a-lp/               # クライアントAのLP
│   ├── src/
│   ├── functions/
│   └── firebase.json
├── client-b-lp/               # クライアントBのLP
│   ├── src/
│   ├── functions/
│   └── firebase.json
└── client-c-lp/              # クライアントCのLP
    ├── src/
    ├── functions/
    └── firebase.json

共通基盤 (memorylink-cms)
├── Functions
│   ├── /api/...              # 共通API
│   └── /tenant/...           # テナント管理API
└── Firestore
    ├── tenants/              # テナント情報
    ├── client-a/             # クライアントAデータ
    ├── client-b/             # クライアントBデータ
    └── client-c/             # クライアントCデータ
```

## 🔧 **実装詳細**

### **1. テナント分離戦略**

#### **データベース分離**
```typescript
// Firestore構造
tenants/
├── client-a/
│   ├── config/               # クライアントA設定
│   ├── users/                # クライアントAユーザー
│   └── data/                 # クライアントAデータ
├── client-b/
│   ├── config/
│   ├── users/
│   └── data/
└── client-c/
    ├── config/
    ├── users/
    └── data/
```

#### **API分離**
```typescript
// テナント固有API
export const clientSpecificAPI = async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'];
  const clientData = await getClientData(tenantId);
  
  // クライアント固有の処理
  return res.json(clientData);
};
```

### **2. ブランディング分離**

#### **動的テーマシステム**
```typescript
// テナント設定
interface TenantConfig {
  id: string;
  name: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    fonts: string[];
  };
  features: {
    customForm: boolean;
    analytics: boolean;
    integrations: string[];
  };
}
```

#### **動的CSS生成**
```css
/* クライアント固有のCSS */
[data-tenant="client-a"] {
  --primary-color: #FF6B6B;
  --secondary-color: #4ECDC4;
  --font-family: 'Arial', sans-serif;
}

[data-tenant="client-b"] {
  --primary-color: #45B7D1;
  --secondary-color: #96CEB4;
  --font-family: 'Helvetica', sans-serif;
}
```

### **3. セキュリティ分離**

#### **テナント認証**
```typescript
// テナント固有の認証
export const authenticateTenant = async (req: Request) => {
  const tenantId = req.headers['x-tenant-id'];
  const apiKey = req.headers['x-api-key'];
  
  const isValid = await validateTenantCredentials(tenantId, apiKey);
  if (!isValid) {
    throw new Error('Invalid tenant credentials');
  }
  
  return tenantId;
};
```

#### **データアクセス制御**
```typescript
// テナント固有のデータアクセス
export const getTenantData = async (tenantId: string, userId: string) => {
  const userData = await firestore
    .collection('tenants')
    .doc(tenantId)
    .collection('users')
    .doc(userId)
    .get();
    
  return userData.data();
};
```

## 🚀 **BtoB LP作成フロー**

### **Step 1: クライアント登録**
```bash
# 新しいクライアントの登録
firebase functions:config:set tenants.client-d.id="client-d"
firebase functions:config:set tenants.client-d.name="Client D Corp"
firebase functions:config:set tenants.client-d.api_key="secure-api-key"
```

### **Step 2: LPリポジトリ作成**
```bash
# クライアント専用リポジトリ
git clone https://github.com/petmemory/lp-template.git client-d-lp
cd client-d-lp
npm install
```

### **Step 3: ブランディング設定**
```json
// client-d-lp/config/branding.json
{
  "tenantId": "client-d",
  "branding": {
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4",
    "logo": "https://client-d.com/logo.png",
    "fonts": ["Arial", "Helvetica"]
  },
  "features": {
    "customForm": true,
    "analytics": true,
    "integrations": ["google-analytics", "facebook-pixel"]
  }
}
```

### **Step 4: デプロイ**
```bash
# クライアント固有のデプロイ
cd client-d-lp
firebase use client-d-lp-project
firebase deploy
```

## 📊 **管理戦略**

### **自社LP管理**
- **統合型**: 単一リポジトリで効率管理
- **共通化**: 共通コンポーネントの再利用
- **一括デプロイ**: 複数LPの同時更新

### **BtoB LP管理**
- **分散型**: 個別リポジトリで独立管理
- **カスタマイズ**: クライアント固有の要件対応
- **個別デプロイ**: クライアントごとの独立デプロイ

### **共通基盤管理**
- **API提供**: 統一されたAPIエンドポイント
- **テナント管理**: マルチテナント対応
- **データ分離**: 完全なデータ分離

## 💡 **運用メリット**

### **✅ 自社LP**
- **効率性**: 統合管理による効率化
- **一貫性**: 統一されたブランディング
- **迅速性**: テンプレートベースの展開

### **✅ BtoB LP**
- **独立性**: 完全な独立運営
- **カスタマイズ**: クライアント固有の要件対応
- **セキュリティ**: 完全なデータ分離

### **✅ 共通基盤**
- **スケーラビリティ**: 多数のクライアント対応
- **保守性**: 統一されたAPI管理
- **コスト効率**: 共通インフラの活用

## 🎯 **結論**

### **推奨: ハイブリッド分離型アーキテクチャ**

**理由:**
1. **自社LP**: 統合型で効率性を確保
2. **BtoB LP**: 分散型で独立性を確保
3. **共通基盤**: 既存CMSを活用してコスト効率化
4. **スケーラビリティ**: 多数のBtoBクライアントに対応

**この設計で、自社LPの効率性とBtoB LPの独立性を両立できます！**

---

*BtoBマルチテナント対応で、ビジネス成長を加速しましょう！*
