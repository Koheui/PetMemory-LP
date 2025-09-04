# 🎯 LPテンプレート - 超シンプル版

## 📋 **概要**
このテンプレートは、複数のLPを作成する際の統一されたベースです。
CMS側にすべての処理を委ね、LPはフォーム入力のみに特化しています。

## 🏗️ **構成**

```
[tenant-id]-lp/
├── src/
│   ├── index.html          # メインHTML
│   ├── css/
│   │   └── main.css        # スタイル
│   └── js/
│       └── main.js         # シンプルなJS
├── config/
│   └── tenant.json         # テナント設定
├── .env                    # 環境変数
├── package.json
└── vite.config.js
```

## ⚙️ **設定ファイル**

### **config/tenant.json**
```json
{
  "tenantId": "petmem",
  "tenantName": "PetMemory Inc.",
  "branding": {
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4",
    "logo": "https://petmemory.com/logo.png"
  },
  "features": {
    "customForm": true,
    "analytics": true
  }
}
```

### **.env**
```bash
VITE_CMS_API_BASE=https://memorylink-cms.cloudfunctions.net
VITE_RECAPTCHA_SITE_KEY=6LeCp7wrAAAAACXaot0OR0ClPJ-jeM7f17OpfkoX
VITE_TENANT_ID=petmem
VITE_LP_ID=direct
```

## 🚀 **使用方法**

1. **テンプレートをクローン**
```bash
git clone https://github.com/petmemory/lp-template.git [tenant-id]-lp
cd [tenant-id]-lp
```

2. **設定を更新**
```bash
# テナント設定
vim config/tenant.json

# 環境変数
vim .env
```

3. **ビルド・デプロイ**
```bash
npm install
npm run build
firebase deploy
```

## 📝 **LP側の責任範囲**

### **✅ LP側で行うこと**
- フォーム表示
- 基本的なバリデーション
- reCAPTCHA表示
- CMS APIへのデータ送信
- 成功/エラー表示

### **❌ LP側で行わないこと**
- メール送信処理
- ユーザー管理
- データ保存
- 認証処理
- セキュリティ検証

## 🔗 **CMS連携**

### **API エンドポイント**
```
POST https://memorylink-cms.cloudfunctions.net/api/gate/lp-form
```

### **送信データ**
```json
{
  "email": "user@example.com",
  "tenant": "petmem",
  "lpId": "direct",
  "productType": "acrylic",
  "recaptchaToken": "..."
}
```

### **レスポンス**
```json
{
  "success": true,
  "message": "メールを送信しました。受信ボックスをご確認ください。",
  "data": {
    "requestId": "abc123def456"
  }
}
```

## 🎨 **カスタマイズ**

### **ブランディング**
- `config/tenant.json` で色やロゴを変更
- `src/css/main.css` でスタイルを調整

### **機能追加**
- アナリティクス設定
- カスタムフォーム項目
- 多言語対応

## 📚 **参考ドキュメント**

- [LP-CMS連携設計書](../docs/LP_CMS_INTEGRATION_GUIDE.md)
- [統一マルチテナントアーキテクチャ](../docs/UNIFIED_MULTITENANT_ARCHITECTURE.md)
- [LP開発ガイド](../docs/LP_DEVELOPMENT_GUIDE.md)
