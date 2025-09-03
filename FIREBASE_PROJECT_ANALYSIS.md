# 🔍 LP用Firebaseプロジェクトの必要性と環境変数確認

## 📊 **現在の状況分析**

### **✅ 既存のCMSプロジェクト**
- **プロジェクト**: `memorylink-cms`
- **URL**: `https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/`
- **状態**: 稼働中

### **✅ LP側の現在の状況**
- **開発環境**: `http://localhost:3000` (Vite)
- **モックサーバー**: `http://localhost:5001` (Node.js)
- **状態**: 開発・テスト中

## 🤔 **LP用Firebaseプロジェクトの必要性**

### **Option 1: 既存CMSプロジェクトを活用（推奨）**
```
memorylink-cms (既存プロジェクト)
├── Hosting Sites
│   ├── lp-example-com     # LP用サイト
│   ├── lp-petmem-com      # 別LP用サイト
│   └── app-example-com    # 既存のメインアプリ
├── Functions
│   └── /api/gate/lp-form  # 既存のAPI
└── Firestore
    └── tenants/...        # 既存のデータ
```

### **Option 2: 新しいLP専用プロジェクト**
```
petmemory-lp (新しいプロジェクト)
├── Hosting Sites
│   ├── lp-example-com     # LP用サイト
│   └── lp-petmem-com      # 別LP用サイト
└── Functions
    └── /api-gate/lp-form  # LP専用API（CMS呼び出し）

memorylink-cms (既存プロジェクト)
├── Functions
│   └── /api/gate/lp-form  # 既存のAPI
└── Firestore
    └── tenants/...        # 既存のデータ
```

## 🎯 **推奨アプローチ: 既存CMSプロジェクトを活用**

### **理由**
1. **管理の一元化**: 単一プロジェクトで管理
2. **コスト効率**: 追加プロジェクト不要
3. **設定の簡素化**: 既存の設定を活用
4. **セキュリティ**: 既存のセキュリティ設定を活用

## 🔧 **必要な環境変数の確認**

### **✅ LP側の環境変数（現在の設定）**
```javascript
// src/lp/index.html
window.VITE_CMS_API_BASE = 'http://localhost:5001';           // 開発用
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';  // 本番キー
window.VITE_TENANT_ID = 'petmem';                            // テナントID
window.VITE_LP_ID = 'direct';                               // LP ID
```

### **✅ 本番環境用の環境変数**
```javascript
// 本番環境用
window.VITE_CMS_API_BASE = 'https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app';
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';  // 本番キー
window.VITE_TENANT_ID = 'petmem';
window.VITE_LP_ID = 'direct';
```

### **❌ 不足している環境変数**

#### **1. CMS側の環境変数**
```bash
# 未設定の環境変数
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"
firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"
firebase functions:config:set cors.allowed_origins="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app,https://lp-example-com.web.app,https://lp-petmem-com.web.app,http://localhost:3000,http://localhost:3001"
firebase functions:config:set app.claim_continue_url="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"
```

#### **2. Firebase Hosting設定**
```bash
# Hostingサイトの作成
firebase hosting:sites:create lp-example-com
firebase hosting:sites:create lp-petmem-com
```

## 🚀 **実装手順**

### **Phase 1: 既存CMSプロジェクトの活用**

#### **Step 1: プロジェクト選択**
```bash
firebase use memorylink-cms
```

#### **Step 2: Hostingサイト作成**
```bash
# LP用のHostingサイトを作成
firebase hosting:sites:create lp-example-com
firebase hosting:sites:create lp-petmem-com
```

#### **Step 3: firebase.jsonの更新**
```json
{
  "hosting": [
    {
      "site": "lp-example-com",
      "public": "lp_dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "**/*.@(css|js)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "/**",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            }
          ]
        }
      ]
    },
    {
      "site": "lp-petmem-com",
      "public": "lp_petmem_dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "**/*.@(css|js)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "/**",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            }
          ]
        }
      ]
    },
    {
      "site": "app-example-com",
      "public": "app_dist",
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ],
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

#### **Step 4: 環境変数設定**
```bash
# reCAPTCHA秘密鍵
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"

# メール送信設定
firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"

# CORS許可リスト
firebase functions:config:set cors.allowed_origins="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app,https://lp-example-com.web.app,https://lp-petmem-com.web.app,http://localhost:3000,http://localhost:3001"

# アプリ認証URL
firebase functions:config:set app.claim_continue_url="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"
```

### **Phase 2: LP側の環境変数更新**

#### **Step 1: 本番環境用の環境変数設定**
```javascript
// src/lp/index.html
window.VITE_CMS_API_BASE = 'https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app';
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';
window.VITE_TENANT_ID = 'petmem';
window.VITE_LP_ID = 'direct';
```

#### **Step 2: ビルドとデプロイ**
```bash
# LPのビルド
npm run build

# LPのデプロイ
firebase deploy --only hosting:lp-example-com
```

## 💡 **結論**

### **✅ LP用Firebaseプロジェクトは不要**
- **理由**: 既存のCMSプロジェクトで十分
- **利点**: 管理の一元化、コスト効率、設定の簡素化

### **✅ 不足している環境変数**
1. **CMS側のreCAPTCHA秘密鍵**
2. **CMS側のメール送信設定**
3. **CMS側のCORS設定**
4. **Firebase Hostingサイトの作成**

### **🚀 次のステップ**
1. **既存CMSプロジェクトの活用**
2. **不足環境変数の設定**
3. **LPのデプロイ**

---

*既存CMSプロジェクトを活用することで、効率的でコスト効果的なLP運用が実現できます！*
