# 🚀 Firebaseプロジェクト設定ガイド

## 🎯 **推奨アプローチ: 既存プロジェクトの活用**

### **使用するプロジェクト**
- **Project ID**: `memorylink-cms`
- **Display Name**: `MemoryLink CMS`

### **理由**
1. **CMSが既に構築済み** - APIエンドポイントが利用可能
2. **管理の一元化** - 単一プロジェクトでLP + CMS管理
3. **コスト効率** - 追加プロジェクト不要

## 🔧 **設定手順**

### **Step 1: プロジェクト選択**
```bash
firebase use memorylink-cms
```

### **Step 2: Hosting設定**
```bash
# Hostingサイトの作成
firebase hosting:sites:create lp-example-com
firebase hosting:sites:create lp-petmem-com
```

### **Step 3: Functions設定**
```bash
# Functionsのデプロイ
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### **Step 4: 環境変数設定**
```bash
# Functions用の環境変数
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"
firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"
```

### **Step 5: ドメイン設定**
```bash
# カスタムドメインの追加（オプション）
firebase hosting:sites:add-domain lp-example-com example.com
firebase hosting:sites:add-domain lp-petmem-com petmem.com
```

## 📊 **プロジェクト構造**

```
memorylink-cms (Firebase Project)
├── Hosting Sites
│   ├── lp-example-com     # LP用サイト
│   ├── lp-petmem-com      # 別LP用サイト
│   └── app-example-com    # メインアプリ用サイト
├── Functions
│   └── /api-gate/lp-form  # 共通LP API
└── Firestore
    └── tenants            # テナント管理
```

## 🚀 **デプロイ手順**

### **初回デプロイ**
```bash
# すべてのLPをビルド
npm run build

# Functionsをデプロイ
firebase deploy --only functions

# Hostingをデプロイ
firebase deploy --only hosting
```

### **個別デプロイ**
```bash
# 特定のLPのみ
npm run deploy:lp
npm run deploy:lp-petmem
```

## 💡 **注意点**

### **CORS設定**
FunctionsでOrigin許可リストを設定：
```typescript
const allowedOrigins = [
  'https://lp-example-com.web.app',
  'https://lp-petmem-com.web.app',
  'https://example.com',
  'https://petmem.com'
];
```

### **reCAPTCHA設定**
- 本番キーをFunctions環境変数に設定
- Origin許可リストにLPドメインを追加

### **テナント管理**
- Originからテナントを自動判定
- 各LP固有の設定を管理

---

*この設定で、既存のCMSプロジェクトを活用して効率的にLP管理ができます！*
