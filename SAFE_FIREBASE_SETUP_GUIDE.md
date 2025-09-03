# 🚨 安全なFirebaseプロジェクト設定ガイド

## ⚠️ **重要な注意事項**

### **現在の状況**
- 既存のCMSプロジェクト（`memorylink-cms`）が存在
- 既存のサイト（`app-example-com`, `mem-example-com`）が設定済み
- **上書きのリスク**があります

## 🛡️ **推奨アプローチ: 新しいプロジェクト作成**

### **理由**
1. **既存CMSの保護** - 上書きリスクを回避
2. **独立した管理** - LP専用の環境
3. **安全な開発** - 既存システムに影響なし

## 🔧 **安全な設定手順**

### **Step 1: 新しいプロジェクト作成**
```bash
# 新しいプロジェクト作成
firebase projects:create petmemory-lp --display-name "PetMemory Landing Pages"

# プロジェクトを選択
firebase use petmemory-lp
```

### **Step 2: LP専用のfirebase.json作成**
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
    }
  ],
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### **Step 3: LP専用のFunctions作成**
```bash
# LP専用のFunctionsディレクトリ
mkdir functions-lp
cd functions-lp
npm init -y
npm install firebase-functions firebase-admin
```

### **Step 4: 環境変数設定**
```bash
# LP専用の環境変数
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"
firebase functions:config:set email.service_key="YOUR_EMAIL_SERVICE_KEY"
```

## 📊 **最終的な構成**

```
petmemory-lp (新しいFirebase Project)
├── Hosting Sites
│   ├── lp-example-com     # LP用サイト
│   └── lp-petmem-com      # 別LP用サイト
└── Functions
    └── /api-gate/lp-form  # LP専用API

memorylink-cms (既存のFirebase Project)
├── Hosting Sites
│   ├── app-example-com    # 既存のメインアプリ
│   └── mem-example-com    # 既存の想い出ページ
├── Functions
│   └── /api/...          # 既存のCMS API
└── Firestore
    └── ...               # 既存のデータ
```

## 🔗 **CMSとの連携**

### **API呼び出し**
```javascript
// LPから既存CMSのAPIを呼び出し
const cmsApiUrl = 'https://memorylink-cms.cloudfunctions.net/api/...';
```

### **CORS設定**
既存CMSのFunctionsでLPドメインを許可：
```typescript
const allowedOrigins = [
  'https://lp-example-com.web.app',
  'https://lp-petmem-com.web.app'
];
```

## 💡 **メリット**

### **✅ 安全性**
- 既存CMSの完全保護
- 上書きリスクなし
- 独立した環境

### **✅ 管理性**
- LP専用の管理
- 既存CMSへの影響なし
- 明確な責任分離

### **✅ スケーラビリティ**
- 新しいLPの追加が簡単
- 既存CMSとの連携可能
- 独立したスケーリング

---

*この方法で、既存のCMSを安全に保護しながら、新しいLPシステムを構築できます！*
