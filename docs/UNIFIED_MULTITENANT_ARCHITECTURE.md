# 🏢 統一マルチテナントアーキテクチャ設計

## 🎯 **統一化の理由**

### **自社LPもBtoB LPも同じ性質**
- **ブランディングの分離**が必要
- **データの分離**が必要
- **カスタマイズ性**が必要
- **独立した運用管理**が必要

### **統一化のメリット**
- **一貫性**: すべてのLPが同じ管理方式
- **スケーラビリティ**: 新しいLP追加が同じ手順
- **運用効率**: 単一の管理方式
- **品質管理**: 統一された品質基準

## 🏗️ **統一アーキテクチャ: 完全分散型**

### **設計方針**
- **すべてのLP**: 個別リポジトリ
- **共通基盤**: 既存CMSを活用
- **統一管理**: 共通のテンプレート・ツール

## 📊 **統一アーキテクチャ構成**

```
LP管理 (個別リポジトリ)
├── petmemory-lp/              # 自社LP
│   ├── src/
│   ├── functions/
│   ├── config/
│   └── firebase.json
├── client-a-lp/               # クライアントAのLP
│   ├── src/
│   ├── functions/
│   ├── config/
│   └── firebase.json
├── client-b-lp/               # クライアントBのLP
│   ├── src/
│   ├── functions/
│   ├── config/
│   └── firebase.json
└── client-c-lp/               # クライアントCのLP
    ├── src/
    ├── functions/
    ├── config/
    └── firebase.json

共通基盤 (memorylink-cms)
├── Functions
│   ├── /api/...              # 共通API
│   └── /tenant/...           # テナント管理API
└── Firestore
    ├── tenants/              # テナント情報
    ├── petmemory/            # 自社データ
    ├── client-a/             # クライアントAデータ
    ├── client-b/             # クライアントBデータ
    └── client-c/             # クライアントCデータ
```

## 🔧 **統一実装詳細**

### **1. 統一テンプレートシステム**

#### **LPテンプレート**
```bash
# 統一されたLPテンプレート
git clone https://github.com/petmemory/lp-template.git [tenant-id]-lp
cd [tenant-id]-lp
npm install
```

#### **統一設定構造**
```json
// config/tenant.json
{
  "tenantId": "petmemory",
  "tenantName": "PetMemory Inc.",
  "tenantType": "self", // "self" | "client"
  "branding": {
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4",
    "logo": "https://petmemory.com/logo.png",
    "fonts": ["Arial", "Helvetica"]
  },
  "features": {
    "customForm": true,
    "analytics": true,
    "integrations": ["google-analytics", "facebook-pixel"]
  },
  "api": {
    "baseUrl": "https://memorylink-cms.cloudfunctions.net",
    "endpoints": {
      "form": "/api-gate/lp-form",
      "analytics": "/api/analytics"
    }
  }
}
```

### **2. 統一デプロイフロー**

#### **統一デプロイスクリプト**
```bash
#!/bin/bash
# deploy-lp.sh

TENANT_ID=$1
LP_DIR="${TENANT_ID}-lp"

echo "🚀 Deploying LP for tenant: ${TENANT_ID}"

# 1. ビルド
cd ${LP_DIR}
npm run build

# 2. デプロイ
firebase use ${TENANT_ID}-lp-project
firebase deploy --only hosting

# 3. 設定更新
firebase functions:config:set tenants.${TENANT_ID}.deployed_at="$(date)"

echo "✅ LP deployed successfully for ${TENANT_ID}"
```

#### **統一管理スクリプト**
```bash
#!/bin/bash
# manage-lps.sh

ACTION=$1
TENANT_ID=$2

case $ACTION in
  "create")
    echo "Creating LP for tenant: ${TENANT_ID}"
    git clone https://github.com/petmemory/lp-template.git ${TENANT_ID}-lp
    cd ${TENANT_ID}-lp
    npm install
    cp config/tenant.example.json config/tenant.json
    # 設定ファイルを編集
    ;;
  "deploy")
    echo "Deploying LP for tenant: ${TENANT_ID}"
    ./deploy-lp.sh ${TENANT_ID}
    ;;
  "update")
    echo "Updating LP for tenant: ${TENANT_ID}"
    cd ${TENANT_ID}-lp
    git pull origin main
    npm install
    ./deploy-lp.sh ${TENANT_ID}
    ;;
  "list")
    echo "Listing all LPs:"
    ls -d *-lp/
    ;;
esac
```

### **3. 統一監視システム**

#### **統一ログ構造**
```typescript
// 統一されたログ構造
interface LPActivityLog {
  tenantId: string;
  tenantName: string;
  tenantType: 'self' | 'client';
  action: 'deploy' | 'update' | 'error' | 'access';
  timestamp: Date;
  details: {
    version: string;
    environment: string;
    userAgent?: string;
    ipAddress?: string;
  };
}
```

#### **統一監視ダッシュボード**
```typescript
// 統一監視API
export const getLPStatus = async (req: Request, res: Response) => {
  const tenants = await getAllTenants();
  const status = await Promise.all(
    tenants.map(async (tenant) => ({
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantType: tenant.type,
      status: await getTenantStatus(tenant.id),
      lastDeploy: await getLastDeploy(tenant.id),
      uptime: await getUptime(tenant.id)
    }))
  );
  
  return res.json(status);
};
```

## 🚀 **統一LP作成フロー**

### **Step 1: テナント登録**
```bash
# 新しいテナントの登録（自社・BtoB共通）
firebase functions:config:set tenants.${TENANT_ID}.id="${TENANT_ID}"
firebase functions:config:set tenants.${TENANT_ID}.name="${TENANT_NAME}"
firebase functions:config:set tenants.${TENANT_ID}.type="${TENANT_TYPE}"
firebase functions:config:set tenants.${TENANT_ID}.api_key="${API_KEY}"
```

### **Step 2: LPリポジトリ作成**
```bash
# 統一テンプレートから作成
./manage-lps.sh create ${TENANT_ID}
```

### **Step 3: ブランディング設定**
```bash
# 設定ファイルの編集
cd ${TENANT_ID}-lp
vim config/tenant.json
```

### **Step 4: デプロイ**
```bash
# 統一デプロイフロー
./manage-lps.sh deploy ${TENANT_ID}
```

## 📊 **統一管理戦略**

### **✅ すべてのLP**
- **個別リポジトリ**: 完全な独立性
- **統一テンプレート**: 一貫した品質
- **統一デプロイ**: 標準化された手順
- **統一監視**: 統合された監視体制

### **✅ 共通基盤**
- **API提供**: 統一されたAPIエンドポイント
- **テナント管理**: 統一されたテナント管理
- **データ分離**: 完全なデータ分離

## 💡 **統一化のメリット**

### **✅ 開発効率**
- **統一テンプレート**: 新LP作成が迅速
- **統一ツール**: 学習コストの削減
- **統一フロー**: 標準化された開発プロセス

### **✅ 運用効率**
- **統一管理**: 単一の管理方式
- **統一監視**: 統合された監視体制
- **統一ドキュメント**: 一貫したドキュメント

### **✅ 品質管理**
- **統一基準**: 一貫した品質基準
- **統一テスト**: 標準化されたテスト
- **統一レビュー**: 統一されたレビュープロセス

## 🎯 **結論**

### **推奨: 完全統一型アーキテクチャ**

**理由:**
1. **一貫性**: すべてのLPが同じ管理方式
2. **スケーラビリティ**: 新しいLP追加が同じ手順
3. **運用効率**: 単一の管理方式
4. **品質管理**: 統一された品質基準

**この設計で、自社LPとBtoB LPを統一管理し、効率的でスケーラブルなシステムを実現できます！**

---

*統一マルチテナントアーキテクチャで、すべてのLPを効率的に管理しましょう！*
