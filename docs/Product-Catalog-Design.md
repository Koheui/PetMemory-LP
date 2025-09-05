# 🛍️ 商品カタログ設計

## 🎯 **目的**
- **動的商品管理**: 価格変更や商品追加をコード修正なしで実行
- **マルチテナント対応**: 各テナントの商品情報を個別管理
- **LP連携**: 商品情報をAPI経由でLPに動的読み込み

## 🏗️ **Firestoreスキーマ設計**

### **1. 商品カタログコレクション**
```
products/{productId}
├── tenant: string           # テナントID
├── lpId: string            # LP ID
├── productType: string     # 商品タイプ（acrylic-stand, baby-brush等）
├── name: string            # 商品名
├── description: string     # 商品説明
├── variants: array         # バリエーション（サイズ等）
│   ├── id: string         # バリエーションID
│   ├── name: string       # バリエーション名（6cm, 10cm等）
│   ├── price: number      # 価格
│   ├── displayOrder: number # 表示順序
│   └── isActive: boolean  # 有効/無効
├── images: array          # 商品画像
│   ├── url: string       # 画像URL
│   ├── alt: string       # alt属性
│   └── displayOrder: number # 表示順序
├── isActive: boolean      # 商品の有効/無効
├── createdAt: timestamp  # 作成日時
└── updatedAt: timestamp  # 更新日時
```

### **2. テナント設定コレクション**
```
tenantConfigs/{tenantId}
├── tenantId: string       # テナントID
├── lpId: string          # LP ID
├── productType: string   # 商品タイプ
├── displaySettings: object # 表示設定
│   ├── currency: string  # 通貨（JPY, USD等）
│   ├── currencySymbol: string # 通貨記号（¥, $等）
│   └── priceFormat: string # 価格表示形式
├── isActive: boolean     # テナントの有効/無効
├── createdAt: timestamp # 作成日時
└── updatedAt: timestamp # 更新日時
```

## 🔌 **API設計**

### **1. 商品情報取得API**
```
GET /api/products/{tenant}/{lpId}/{productType}
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "acrylic-stand-001",
      "name": "NFC付きアクリルスタンド",
      "description": "美しいアクリルスタンドにNFCタグを内蔵",
      "variants": [
        {
          "id": "size-6cm",
          "name": "6cm",
          "price": 4500,
          "displayOrder": 1,
          "isActive": true
        },
        {
          "id": "size-10cm", 
          "name": "10cm",
          "price": 6000,
          "displayOrder": 2,
          "isActive": true
        },
        {
          "id": "size-14cm",
          "name": "14cm", 
          "price": 8000,
          "displayOrder": 3,
          "isActive": true
        }
      ],
      "images": [
        {
          "url": "/assets/hero-product.png",
          "alt": "アクリルスタンドの使用例",
          "displayOrder": 1
        }
      ]
    },
    "config": {
      "currency": "JPY",
      "currencySymbol": "¥",
      "priceFormat": "{symbol}{price:,}"
    }
  }
}
```

### **2. 商品情報更新API**
```
POST /api/products/{tenant}/{lpId}/{productType}
```

**リクエスト例:**
```json
{
  "name": "NFC付きアクリルスタンド",
  "description": "美しいアクリルスタンドにNFCタグを内蔵",
  "variants": [
    {
      "id": "size-6cm",
      "name": "6cm",
      "price": 4500,
      "displayOrder": 1,
      "isActive": true
    }
  ]
}
```

## 🎨 **LP連携実装**

### **1. 動的商品読み込み**
```javascript
// 商品情報をAPIから取得
async function loadProductCatalog() {
  try {
    const response = await fetch('/api/products/futurestudio/emolink.cloud/acrylic-stand');
    const data = await response.json();
    
    if (data.success) {
      renderProductVariants(data.data.product.variants, data.data.config);
    }
  } catch (error) {
    console.error('商品情報の読み込みに失敗:', error);
  }
}

// 商品バリエーションを動的レンダリング
function renderProductVariants(variants, config) {
  const priceContainer = document.getElementById('price-grid');
  
  variants.forEach(variant => {
    if (variant.isActive) {
      const priceCard = createPriceCard(variant, config);
      priceContainer.appendChild(priceCard);
    }
  });
}

// 価格カードを動的生成
function createPriceCard(variant, config) {
  const card = document.createElement('div');
  card.className = 'price-card';
  card.innerHTML = `
    <div class="price-header">
      <h3>${variant.name} サイズ</h3>
    </div>
    <div class="price-value">
      <span class="price-amount">${formatPrice(variant.price, config)}</span>
    </div>
    <button class="btn btn-primary price-btn" 
            data-size="${variant.name}" 
            data-price="${variant.price}">
      サイズを選ぶ
    </button>
  `;
  return card;
}

// 価格フォーマット
function formatPrice(price, config) {
  return config.priceFormat
    .replace('{symbol}', config.currencySymbol)
    .replace('{price}', price);
}
```

### **2. 初期化処理**
```javascript
// ページ読み込み時に商品情報を取得
document.addEventListener('DOMContentLoaded', () => {
  loadProductCatalog();
});
```

## 🔧 **管理画面設計**

### **1. 商品管理画面**
- **商品一覧**: テナント別の商品一覧表示
- **商品編集**: 商品名、説明、価格の編集
- **バリエーション管理**: サイズ、価格の追加・編集・削除
- **画像管理**: 商品画像のアップロード・管理

### **2. テナント設定画面**
- **基本設定**: テナント名、LP ID、商品タイプ
- **表示設定**: 通貨、価格表示形式
- **有効/無効**: テナントの有効/無効切り替え

## 🚀 **実装手順**

### **Phase 1: 基本API実装**
1. **Firestoreスキーマ作成**: 商品カタログコレクション
2. **API実装**: 商品情報取得・更新API
3. **管理画面**: 基本的な商品管理機能

### **Phase 2: LP連携実装**
1. **動的読み込み**: LPでの商品情報動的読み込み
2. **価格表示**: 動的な価格表示
3. **決済連携**: 選択された商品情報の決済処理

### **Phase 3: 高度な機能**
1. **キャッシュ**: 商品情報のキャッシュ機能
2. **バリエーション**: 複数商品タイプ対応
3. **国際化**: 多言語・多通貨対応

## 💡 **メリット**

### **1. 運用効率向上**
- **価格変更**: コード修正なしで価格変更可能
- **商品追加**: 管理画面から新しいサイズ追加
- **A/Bテスト**: 異なる価格でのテスト実施

### **2. マルチテナント対応**
- **個別管理**: 各テナントの商品情報を個別管理
- **ブランディング**: テナント別の商品名・説明
- **価格戦略**: テナント別の価格設定

### **3. スケーラビリティ**
- **新商品**: 新しい商品タイプの追加が容易
- **新テナント**: 新しいテナントの追加が容易
- **機能拡張**: 在庫管理、割引機能等の拡張

この設計により、商品カタログとLPを動的に連携させることができます！
