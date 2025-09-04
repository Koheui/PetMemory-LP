# 🚀 LP管理ガイド - GitHub + Firebase

## 🎯 **シンプルなLP管理方針**

### **使用サービス**
- **GitHub**: コード管理・バージョン管理
- **Firebase**: ホスティング・Functions・Firestore

### **管理方針**
- 単一Firebaseプロジェクトで複数LPを管理
- 共通APIエンドポイントでテナント管理
- テンプレートベースで新しいLPを迅速作成

## 📁 **プロジェクト構造**

```
PetMemory-LP/
├── src/
│   ├── lp/                    # 現在のLP (example.com)
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   ├── lp-petmem/             # 新しいLP (petmem.com)
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   └── shared/                 # 共通コンポーネント
│       ├── components/
│       └── utils/
├── functions/                  # Firebase Functions
├── firebase.json              # 複数サイト設定
├── vite.config.js             # 現在のLP用設定
├── vite.petmem.config.js      # 新しいLP用設定
└── package.json               # ビルドスクリプト
```

## 🔧 **新しいLPの作成手順**

### **Step 1: ディレクトリ作成**
```bash
mkdir src/lp-[site-name]
cp -r src/lp/* src/lp-[site-name]/
```

### **Step 2: Vite設定作成**
```bash
cp vite.config.js vite.[site-name].config.js
```

設定を更新：
```javascript
export default defineConfig({
  root: 'src/lp-[site-name]',
  build: {
    outDir: '../[site-name]_dist',
  },
  server: {
    port: 3002, // ユニークなポート
  }
})
```

### **Step 3: Firebase設定追加**
`firebase.json`に新しいサイトを追加：
```json
{
  "site": "lp-[site-name]-com",
  "public": "[site-name]_dist",
  // ... 他の設定
}
```

### **Step 4: package.jsonスクリプト追加**
```json
{
  "scripts": {
    "build:[site-name]": "vite build --config vite.[site-name].config.js",
    "dev:[site-name]": "vite --config vite.[site-name].config.js",
    "deploy:[site-name]": "firebase deploy --only hosting:lp-[site-name]-com"
  }
}
```

### **Step 5: 環境変数設定**
新しいLPのHTMLファイルで：
```html
<script>
  window.VITE_TENANT_ID = '[tenant-id]';
  window.VITE_LP_ID = '[lp-id]';
  window.VITE_CMS_API_BASE = 'https://your-cms-project.cloudfunctions.net';
  window.VITE_RECAPTCHA_SITE_KEY = '[recaptcha-key]';
</script>
```

## 🚀 **デプロイ手順**

### **開発環境**
```bash
# 現在のLP
npm run dev

# 新しいLP
npm run dev:petmem
```

### **本番デプロイ**
```bash
# すべてのLPをビルド
npm run build

# 特定のLPのみデプロイ
npm run deploy:lp
npm run deploy:lp-petmem

# すべてデプロイ
npm run deploy
```

## 🔗 **Firebase Functions設定**

### **共通APIエンドポイント**
```typescript
// functions/src/api/lpForm.ts
export const lpForm = async (req: Request, res: Response) => {
  const origin = req.headers.origin;
  const tenant = getTenantFromOrigin(origin); // Originからテナントを特定
  
  // テナント固有の処理
  const lpConfig = await getLPConfig(tenant);
  
  // 処理続行...
};
```

### **テナント管理**
```typescript
// functions/src/utils/tenant.ts
export const getTenantFromOrigin = (origin: string): string => {
  const tenantMap = {
    'https://lp-example-com.web.app': 'petmem',
    'https://lp-petmem-com.web.app': 'petmem',
    'https://example.com': 'petmem',
    'https://petmem.com': 'petmem',
  };
  
  return tenantMap[origin] || 'default';
};
```

## 📊 **管理の利点**

### **✅ シンプルな管理**
- 単一Firebaseプロジェクト
- 単一GitHubリポジトリ
- 共通APIエンドポイント

### **✅ 効率的な開発**
- テンプレートベースの作成
- 共通コンポーネントの再利用
- 一括ビルド・デプロイ

### **✅ スケーラブル**
- 新しいLPの追加が簡単
- テナント管理の自動化
- 共通設定の一元管理

## 🎯 **運用フロー**

### **新しいLP作成時**
1. テンプレートからコピー
2. 設定ファイル作成
3. 環境変数設定
4. テスト・デプロイ

### **更新時**
1. 共通コンポーネント更新
2. 各LPに反映
3. 一括テスト
4. 一括デプロイ

### **監視**
- Firebase Analytics
- Firebase Performance
- エラーログ監視

## 💡 **ベストプラクティス**

### **コード管理**
- 共通コンポーネントは`shared/`に配置
- 各LP固有の設定は環境変数で管理
- テンプレート化して再利用

### **デプロイ**
- 開発・ステージング・本番環境の分離
- 自動テストの実行
- ロールバック機能の準備

### **セキュリティ**
- reCAPTCHAの適切な設定
- CORS設定の管理
- 環境変数の暗号化

---

*このガイドに従って、シンプルで効率的なLP管理を実現できます！*

