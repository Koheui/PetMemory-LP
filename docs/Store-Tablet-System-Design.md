# 🏪 店頭販売用タブレットシステム設計書

## 📋 **概要**

店頭販売時にタブレット端末を使用して、顧客のメールアドレス入力とテナント・LP・プロダクトタイプの選択により、既存のLPシステムと同様の機能でCMSにアクセス可能にするシステム。

## 🎯 **目的**

- **店頭決済**: クライアントのレジで決済完了
- **CMS接続**: タブレットでメール認証によるCMSアクセス
- **不正防止**: 店舗認証とアクセス制御
- **統一性**: 既存LPシステムとの一貫性

## 🏗️ **アーキテクチャ**

```
店頭タブレット
├── テナント選択
├── LP選択
├── プロダクトタイプ選択
├── メールアドレス入力
└── メール認証送信

↓ 既存API活用

Firebase Functions
├── /api/gate/lp-form (既存)
├── /api/store/authenticate (新規)
└── /api/store/validate (新規)

↓ メール送信

Gmail SMTP
└── 認証メール送信

↓ CMS接続

CMS (emolink.net)
├── メール認証
├── 想い出ページ作成
└── 管理機能
```

## 🔧 **実装詳細**

### **1. 店頭タブレットUI**

#### **画面構成**
1. **店舗認証画面** - 店舗ID・パスワード入力
2. **設定選択画面** - テナント・LP・プロダクトタイプ選択
3. **顧客入力画面** - メールアドレス入力
4. **送信完了画面** - メール送信完了通知

#### **選択肢管理**
```javascript
// テナント選択
const tenants = [
  { id: 'petmem', name: 'PetMemory', stores: ['store-001', 'store-002'] },
  { id: 'futurestudio', name: 'Future Studio', stores: ['store-003'] },
  { id: 'client-a', name: 'Client A', stores: ['store-004', 'store-005'] }
];

// LP選択（テナントに応じて動的）
const lpOptions = {
  'petmem': [
    { id: 'direct', name: 'PetMemory Direct' },
    { id: 'partner1', name: 'Partner Store 1' }
  ],
  'futurestudio': [
    { id: 'emolink.cloud', name: 'Emolink Cloud' },
    { id: 'direct', name: 'Future Studio Direct' }
  ]
};

// プロダクトタイプ選択
const productTypes = [
  { id: 'acrylic', name: 'NFCタグ付きアクリルスタンド', price: 4980 },
  { id: 'digital', name: 'デジタル想い出ページ', price: 2980 },
  { id: 'premium', name: 'プレミアム想い出サービス', price: 7980 }
];
```

### **2. 店舗認証システム**

#### **店舗認証API**
```javascript
// /api/store/authenticate
{
  "storeId": "store-001",
  "password": "store_password_hash",
  "deviceId": "tablet_device_id"
}
```

#### **レスポンス**
```javascript
{
  "ok": true,
  "store": {
    "id": "store-001",
    "name": "PetMemory Store Tokyo",
    "tenant": "petmem",
    "allowedLpIds": ["direct", "partner1"],
    "allowedProductTypes": ["acrylic", "digital"]
  },
  "sessionToken": "store_session_token"
}
```

### **3. 既存APIの活用**

#### **LPフォームAPIの拡張**
```javascript
// 既存の /api/gate/lp-form を店頭用に拡張
{
  "email": "customer@example.com",
  "tenant": "petmem",
  "lpId": "partner1",
  "productType": "acrylic",
  "source": "store-tablet", // 新規追加
  "storeId": "store-001",   // 新規追加
  "recaptchaToken": "token"
}
```

### **4. セキュリティ機能**

#### **不正利用防止**
- **店舗認証**: 店舗ID・パスワード認証
- **デバイス認証**: タブレット端末の登録
- **セッション管理**: 店舗セッションの有効期限
- **アクセス制御**: 店舗ごとの権限設定

#### **監査ログ**
```javascript
// 店頭販売の監査ログ
{
  "timestamp": "2025-01-05T10:30:00Z",
  "storeId": "store-001",
  "tenant": "petmem",
  "lpId": "partner1",
  "productType": "acrylic",
  "customerEmail": "customer@example.com",
  "deviceId": "tablet_device_id",
  "action": "store_form_submission"
}
```

## 📱 **タブレットUI設計**

### **画面1: 店舗認証**
```html
<div class="store-auth">
  <h2>店舗認証</h2>
  <input type="text" placeholder="店舗ID" id="storeId">
  <input type="password" placeholder="パスワード" id="storePassword">
  <button onclick="authenticateStore()">認証</button>
</div>
```

### **画面2: 設定選択**
```html
<div class="config-selection">
  <h2>設定選択</h2>
  
  <div class="form-group">
    <label>テナント</label>
    <select id="tenantSelect" onchange="updateLpOptions()">
      <option value="">選択してください</option>
      <option value="petmem">PetMemory</option>
      <option value="futurestudio">Future Studio</option>
    </select>
  </div>
  
  <div class="form-group">
    <label>LP</label>
    <select id="lpSelect">
      <option value="">テナントを選択してください</option>
    </select>
  </div>
  
  <div class="form-group">
    <label>プロダクトタイプ</label>
    <select id="productTypeSelect">
      <option value="acrylic">NFCタグ付きアクリルスタンド (¥4,980)</option>
      <option value="digital">デジタル想い出ページ (¥2,980)</option>
      <option value="premium">プレミアム想い出サービス (¥7,980)</option>
    </select>
  </div>
  
  <button onclick="proceedToCustomerInput()">次へ</button>
</div>
```

### **画面3: 顧客入力**
```html
<div class="customer-input">
  <h2>顧客情報入力</h2>
  
  <div class="selected-config">
    <p><strong>テナント:</strong> <span id="selectedTenant"></span></p>
    <p><strong>LP:</strong> <span id="selectedLp"></span></p>
    <p><strong>プロダクト:</strong> <span id="selectedProduct"></span></p>
  </div>
  
  <div class="form-group">
    <label>顧客のメールアドレス</label>
    <input type="email" id="customerEmail" placeholder="customer@example.com">
  </div>
  
  <button onclick="submitCustomerForm()">メール送信</button>
</div>
```

## 🔄 **データフロー**

### **1. 店舗認証フロー**
```
タブレット → 店舗認証API → 店舗情報取得 → セッション作成
```

### **2. 顧客登録フロー**
```
顧客入力 → LPフォームAPI → メール送信 → CMS認証
```

### **3. 監査フロー**
```
各操作 → 監査ログ記録 → Firestore保存 → 管理画面表示
```

## 🛡️ **セキュリティ考慮事項**

### **1. 店舗認証**
- **パスワードハッシュ化**: bcrypt使用
- **セッション管理**: JWTトークン
- **デバイス登録**: タブレット端末の登録制限

### **2. アクセス制御**
- **店舗権限**: 店舗ごとのテナント・LP制限
- **時間制限**: 営業時間外のアクセス制限
- **IP制限**: 店舗IPからのアクセスのみ許可

### **3. 監査・ログ**
- **操作ログ**: すべての操作を記録
- **エラーログ**: 異常なアクセスの検出
- **定期監査**: 月次でのアクセス状況確認

## 📊 **管理機能**

### **1. 店舗管理**
- **店舗登録**: 新しい店舗の追加
- **権限設定**: 店舗ごとのアクセス権限
- **デバイス管理**: タブレット端末の登録・管理

### **2. 監視機能**
- **リアルタイム監視**: 現在の店舗アクセス状況
- **統計レポート**: 日次・月次の販売統計
- **アラート機能**: 異常なアクセスの通知

## 🚀 **実装スケジュール**

### **Phase 1: 基本機能 (1週間)**
- 店舗認証システム
- 基本的なタブレットUI
- 既存APIの拡張

### **Phase 2: セキュリティ強化 (1週間)**
- 不正利用防止機能
- 監査ログシステム
- アクセス制御

### **Phase 3: 管理機能 (1週間)**
- 店舗管理画面
- 監視・統計機能
- レポート機能

## 💰 **コスト効果**

### **開発コスト**
- **既存システム活用**: 70%の機能を再利用
- **新規開発**: 30%の機能のみ新規実装
- **開発期間**: 3週間程度

### **運用コスト**
- **インフラ**: 既存Firebase Functions使用
- **メンテナンス**: 既存システムと統合管理
- **スケーラビリティ**: 店舗数に応じて自動拡張

## 🎯 **結論**

既存のLPシステムをベースに、店頭販売用タブレットシステムを効率的に実装可能です。主なメリット：

1. **開発効率**: 既存APIの70%を再利用
2. **統一性**: LPシステムとの一貫性
3. **セキュリティ**: 店舗認証とアクセス制御
4. **スケーラビリティ**: 店舗数の増加に対応
5. **コスト効果**: 最小限の開発コスト

この設計により、店頭販売でも既存のLPシステムと同様の機能を提供でき、不正利用を防止しながら効率的な運用が可能になります。
