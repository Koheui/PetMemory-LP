# 📋 顧客情報入力タイミング設計

## 🎯 **要件整理**

### **1. 必要な顧客情報**
- **配送先住所**: アクリルスタンド配送用
- **連絡先**: メールアドレス、電話番号
- **顧客名**: 配送先名、請求先名
- **その他**: 配送希望日時、備考等

### **2. システム連携要件**
- **LP**: 顧客情報入力
- **CMS**: 想い出ページ作成
- **顧客管理システム**: 顧客情報管理
- **NFCライティングアプリ**: 配送先検索・NFC書込

## 💡 **顧客情報入力タイミング提案**

### **提案1: 写真アップロード + 顧客情報入力 + 決済**

#### **フロー**
```
1. 価格選択 → サイズを選ぶ
2. 写真アップロード → アクリルにしたい写真を選択
3. 顧客情報入力 → 住所、連絡先、顧客名を入力
4. 決済 → Stripe決済
5. 秘密鍵メール → 決済完了後、秘密鍵をメール送信
6. CMSアクセス → メール内のリンクでCMSにアクセス
7. 想い出ページ作成 → 写真とメッセージを追加
8. 制作・発送 → アクリルスタンド制作・配送
```

#### **メリット**
- **完全な情報**: 決済前に全必要情報を収集
- **安心感**: 写真 + 住所 + 決済の順序で安心
- **効率的**: 一度の入力で完了

#### **デメリット**
- **フローが長い**: 入力項目が多い
- **離脱リスク**: 住所入力で離脱する可能性

### **提案2: 決済 + 写真アップロード + 顧客情報入力**

#### **フロー**
```
1. 価格選択 → サイズを選ぶ
2. 決済 → Stripe決済（最小限の情報のみ）
3. 写真アップロード → アクリルにしたい写真を選択
4. 顧客情報入力 → 住所、連絡先、顧客名を入力
5. 秘密鍵メール → 全情報入力完了後、秘密鍵をメール送信
6. CMSアクセス → メール内のリンクでCMSにアクセス
7. 想い出ページ作成 → 写真とメッセージを追加
8. 制作・発送 → アクリルスタンド制作・配送
```

#### **メリット**
- **早期決済**: 決済が先でコミットメント向上
- **段階的**: 決済 → 写真 → 住所の順序
- **シンプル**: 各ステップが明確

#### **デメリット**
- **不安感**: 決済後に住所入力
- **複雑性**: 複数ステップに分かれる

### **提案3: 段階的入力（推奨）**

#### **フロー**
```
1. 価格選択 → サイズを選ぶ
2. 基本情報入力 → メールアドレス、電話番号
3. 写真アップロード → アクリルにしたい写真を選択
4. 配送先入力 → 住所、顧客名
5. 決済 → Stripe決済
6. 秘密鍵メール → 決済完了後、秘密鍵をメール送信
7. CMSアクセス → メール内のリンクでCMSにアクセス
8. 想い出ページ作成 → 写真とメッセージを追加
9. 制作・発送 → アクリルスタンド制作・配送
```

#### **メリット**
- **バランス**: 決済前後で適切に分散
- **ユーザビリティ**: 各ステップが適切な長さ
- **安心感**: 決済前に主要情報を収集

## 🏗️ **技術実装**

### **1. 顧客情報データベース設計**

```typescript
// Firestoreスキーマ
interface CustomerInfo {
  // 基本情報
  email: string;
  phone?: string;
  
  // 配送先情報
  shippingAddress: {
    name: string;           // 配送先名
    postalCode: string;     // 郵便番号
    prefecture: string;     // 都道府県
    city: string;          // 市区町村
    address1: string;      // 住所1
    address2?: string;     // 住所2（マンション名等）
    phone?: string;        // 配送先電話番号
  };
  
  // 請求先情報（配送先と同じ場合は省略可能）
  billingAddress?: {
    name: string;
    postalCode: string;
    prefecture: string;
    city: string;
    address1: string;
    address2?: string;
  };
  
  // その他
  deliveryDate?: Date;     // 配送希望日
  notes?: string;          // 備考
}

// 注文情報
interface Order {
  id: string;
  tenant: string;
  lpId: string;
  productType: string;
  selectedSize: string;
  selectedPrice: number;
  
  // 顧客情報
  customerInfo: CustomerInfo;
  
  // 写真情報
  uploadedPhotos: string[];
  
  // 決済情報
  paymentIntentId?: string;
  secretKey?: string;
  
  // ステータス
  status: 'draft' | 'payment_pending' | 'payment_completed' | 'photo_uploaded' | 'completed';
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // 24時間で期限切れ
}
```

### **2. 顧客情報入力フォーム**

```html
<!-- 顧客情報入力フォーム -->
<form id="customerInfoForm" class="customer-form">
  <!-- 基本情報 -->
  <div class="form-section">
    <h3>基本情報</h3>
    <div class="form-group">
      <label for="email">メールアドレス *</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-group">
      <label for="phone">電話番号</label>
      <input type="tel" id="phone" name="phone">
    </div>
  </div>
  
  <!-- 配送先情報 -->
  <div class="form-section">
    <h3>配送先情報</h3>
    <div class="form-group">
      <label for="shippingName">配送先名 *</label>
      <input type="text" id="shippingName" name="shippingName" required>
    </div>
    <div class="form-group">
      <label for="postalCode">郵便番号 *</label>
      <input type="text" id="postalCode" name="postalCode" pattern="[0-9]{3}-[0-9]{4}" required>
    </div>
    <div class="form-group">
      <label for="prefecture">都道府県 *</label>
      <select id="prefecture" name="prefecture" required>
        <option value="">選択してください</option>
        <option value="北海道">北海道</option>
        <option value="青森県">青森県</option>
        <!-- ... 他の都道府県 -->
      </select>
    </div>
    <div class="form-group">
      <label for="city">市区町村 *</label>
      <input type="text" id="city" name="city" required>
    </div>
    <div class="form-group">
      <label for="address1">住所1 *</label>
      <input type="text" id="address1" name="address1" required>
    </div>
    <div class="form-group">
      <label for="address2">住所2（マンション名等）</label>
      <input type="text" id="address2" name="address2">
    </div>
  </div>
  
  <!-- 請求先情報（オプション） -->
  <div class="form-section">
    <h3>請求先情報</h3>
    <div class="form-group">
      <label>
        <input type="checkbox" id="sameAsShipping" name="sameAsShipping">
        配送先と同じ
      </label>
    </div>
    <div id="billingAddressFields" style="display: none;">
      <!-- 請求先フィールド -->
    </div>
  </div>
  
  <!-- 配送希望日 -->
  <div class="form-section">
    <h3>配送希望日</h3>
    <div class="form-group">
      <label for="deliveryDate">希望日</label>
      <input type="date" id="deliveryDate" name="deliveryDate">
    </div>
    <div class="form-group">
      <label for="notes">備考</label>
      <textarea id="notes" name="notes" rows="3"></textarea>
    </div>
  </div>
</form>
```

### **3. 顧客管理システム連携**

```typescript
// 顧客管理システム用API
export async function handleGetCustomerInfo(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.params;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    
    const orderData = orderDoc.data();
    
    res.json({
      success: true,
      data: {
        orderId: orderDoc.id,
        customerInfo: orderData.customerInfo,
        productInfo: {
          size: orderData.selectedSize,
          price: orderData.selectedPrice
        },
        photos: orderData.uploadedPhotos,
        status: orderData.status
      }
    });
    
  } catch (error) {
    console.error('顧客情報取得エラー:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// NFCライティングアプリ用API
export async function handleGetShippingInfo(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.params;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    
    const orderData = orderDoc.data();
    
    res.json({
      success: true,
      data: {
        orderId: orderDoc.id,
        shippingAddress: orderData.customerInfo.shippingAddress,
        productInfo: {
          size: orderData.selectedSize,
          price: orderData.selectedPrice
        },
        status: orderData.status
      }
    });
    
  } catch (error) {
    console.error('配送情報取得エラー:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
```

### **4. 郵便番号自動入力**

```javascript
// 郵便番号から住所自動入力
async function autoFillAddress(postalCode) {
  try {
    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
    const data = await response.json();
    
    if (data.status === 200 && data.results) {
      const result = data.results[0];
      document.getElementById('prefecture').value = result.address1;
      document.getElementById('city').value = result.address2 + result.address3;
    }
  } catch (error) {
    console.error('住所自動入力エラー:', error);
  }
}

// 郵便番号入力時のイベント
document.getElementById('postalCode').addEventListener('blur', (e) => {
  const postalCode = e.target.value.replace(/-/g, '');
  if (postalCode.length === 7) {
    autoFillAddress(postalCode);
  }
});
```

## 🎯 **推奨案**

### **提案3: 段階的入力**

#### **理由**
1. **ユーザビリティ**: 各ステップが適切な長さ
2. **安心感**: 決済前に主要情報を収集
3. **効率性**: 必要な情報を段階的に収集
4. **システム連携**: 顧客管理システムとの連携が容易

#### **実装優先度**
1. **Phase 1**: 顧客情報入力フォーム
2. **Phase 2**: 郵便番号自動入力
3. **Phase 3**: 顧客管理システムAPI
4. **Phase 4**: NFCライティングアプリ連携

## 🚀 **次のステップ**

1. **フロー決定**: 提案3の段階的入力
2. **UI/UX設計**: 顧客情報入力フォーム
3. **技術実装**: 郵便番号API、顧客管理API
4. **システム連携**: 顧客管理システム、NFCライティングアプリ

**この提案はいかがでしょうか？他にご要望はありますか？**
