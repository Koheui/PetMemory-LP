# 💳 商品決済ページ設計

## 🎯 **目的**
- **決済前確認**: 選択した商品、写真、配送先の最終確認
- **決済処理**: Stripe決済の実行
- **データ保存**: 注文データの保存
- **秘密鍵生成**: 決済完了後の秘密鍵生成とメール送信

## 🏗️ **決済ページの構成**

### **1. 決済前確認セクション**
```html
<!-- 注文内容確認 -->
<div class="order-summary">
  <h3>注文内容</h3>
  <div class="product-info">
    <div class="product-image">
      <img src="uploaded-photo.jpg" alt="アップロードされた写真">
    </div>
    <div class="product-details">
      <h4>NFC付きアクリルスタンド</h4>
      <p>サイズ: 10cm</p>
      <p>価格: ¥6,000</p>
    </div>
  </div>
</div>

<!-- 配送先確認 -->
<div class="shipping-summary">
  <h3>配送先</h3>
  <div class="shipping-info">
    <p>田中太郎</p>
    <p>〒123-4567</p>
    <p>東京都渋谷区道玄坂1-2-3</p>
    <p>○○マンション101号室</p>
  </div>
</div>

<!-- 合計金額 -->
<div class="total-summary">
  <div class="price-breakdown">
    <div class="item-price">
      <span>商品価格</span>
      <span>¥6,000</span>
    </div>
    <div class="shipping-price">
      <span>送料</span>
      <span>無料</span>
    </div>
    <div class="total-price">
      <span>合計</span>
      <span>¥6,000</span>
    </div>
  </div>
</div>
```

### **2. 決済処理セクション**
```html
<!-- Stripe決済 -->
<div class="payment-section">
  <h3>お支払い情報</h3>
  <div class="card-element-container">
    <div id="card-element" class="stripe-card-element">
      <!-- Stripe Elements will create form elements here -->
    </div>
    <div id="card-errors" class="form-error" role="alert"></div>
  </div>
  
  <button id="submit-payment" class="btn btn-primary btn-large">
    <span class="btn-text">¥6,000で決済する</span>
    <span class="btn-spinner" style="display: none;">処理中...</span>
  </button>
</div>
```

## 🔧 **技術実装**

### **1. 決済ページのJavaScript**
```javascript
/**
 * 商品決済ページ
 * 決済前確認とStripe決済処理
 */

// 決済データ
let paymentData = {
  orderId: null,
  productInfo: null,
  customerInfo: null,
  photos: [],
  totalAmount: 0
};

/**
 * 決済ページ初期化
 */
function initializePaymentPage() {
  // 注文データを取得
  loadOrderData();
  
  // 決済前確認を表示
  displayOrderSummary();
  
  // Stripe決済を初期化
  initializeStripePayment();
}

/**
 * 注文データを読み込み
 */
function loadOrderData() {
  // ローカルストレージから注文データを取得
  const orderData = localStorage.getItem('orderData');
  if (orderData) {
    paymentData = JSON.parse(orderData);
  }
}

/**
 * 注文内容を表示
 */
function displayOrderSummary() {
  // 商品情報
  const productInfo = document.getElementById('productInfo');
  if (productInfo && paymentData.productInfo) {
    productInfo.innerHTML = `
      <h4>NFC付きアクリルスタンド</h4>
      <p>サイズ: ${paymentData.productInfo.size}</p>
      <p>価格: ¥${paymentData.productInfo.price.toLocaleString()}</p>
    `;
  }
  
  // アップロードされた写真
  const photoPreview = document.getElementById('photoPreview');
  if (photoPreview && paymentData.photos.length > 0) {
    photoPreview.innerHTML = '';
    paymentData.photos.forEach(photo => {
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = 'アップロードされた写真';
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.objectFit = 'cover';
      img.style.margin = '5px';
      img.style.borderRadius = '8px';
      photoPreview.appendChild(img);
    });
  }
  
  // 配送先情報
  const shippingInfo = document.getElementById('shippingInfo');
  if (shippingInfo && paymentData.customerInfo) {
    const shipping = paymentData.customerInfo.shippingInfo;
    shippingInfo.innerHTML = `
      <p>${shipping.name}</p>
      <p>〒${shipping.postalCode}</p>
      <p>${shipping.prefecture}${shipping.city}${shipping.address1}</p>
      ${shipping.address2 ? `<p>${shipping.address2}</p>` : ''}
    `;
  }
  
  // 合計金額
  const totalAmount = document.getElementById('totalAmount');
  if (totalAmount && paymentData.productInfo) {
    totalAmount.textContent = `¥${paymentData.productInfo.price.toLocaleString()}`;
  }
}

/**
 * Stripe決済処理
 */
async function processPayment() {
  try {
    const submitBtn = document.getElementById('submit-payment');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    
    // ボタンを無効化
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    
    // Payment Intent作成
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: paymentData.customerInfo.basicInfo.email,
        amount: paymentData.productInfo.price,
        metadata: {
          tenant: 'futurestudio',
          lpId: 'emolink.cloud',
          productType: 'acrylic-stand',
          selectedSize: paymentData.productInfo.size,
          shippingInfo: paymentData.customerInfo.shippingInfo,
          photos: paymentData.photos.length
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Stripe決済確認
      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: paymentData.customerInfo.basicInfo.email,
            name: paymentData.customerInfo.shippingInfo.name,
            address: {
              line1: paymentData.customerInfo.shippingInfo.address1,
              city: paymentData.customerInfo.shippingInfo.city,
              postal_code: paymentData.customerInfo.shippingInfo.postalCode,
              country: 'JP'
            }
          }
        }
      });
      
      if (error) {
        throw new Error(error.message);
      } else {
        // 決済成功
        await handlePaymentSuccess(data.paymentIntentId);
      }
    } else {
      throw new Error(data.error);
    }
    
  } catch (error) {
    console.error('決済エラー:', error);
    alert('決済に失敗しました: ' + error.message);
    
    // ボタンを有効化
    const submitBtn = document.getElementById('submit-payment');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    
    submitBtn.disabled = false;
    btnText.style.display = 'inline-block';
    btnSpinner.style.display = 'none';
  }
}

/**
 * 決済成功処理
 */
async function handlePaymentSuccess(paymentIntentId) {
  try {
    // 注文データを保存
    const orderResponse = await fetch('/api/save-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        orderData: paymentData
      })
    });
    
    const orderData = await orderResponse.json();
    
    if (orderData.success) {
      // 成功ページにリダイレクト
      window.location.href = `/payment-success?orderId=${orderData.orderId}`;
    } else {
      throw new Error(orderData.error);
    }
    
  } catch (error) {
    console.error('注文保存エラー:', error);
    alert('注文の保存に失敗しました。お問い合わせください。');
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', initializePaymentPage);
```

### **2. 決済成功ページ**
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>決済完了 - emolink</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div class="container">
        <div class="success-page">
            <div class="success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
            </div>
            
            <h1>決済完了</h1>
            <p class="success-message">
                お支払いが完了しました。<br>
                秘密鍵をメールでお送りいたしますので、受信ボックスをご確認ください。
            </p>
            
            <div class="next-steps">
                <h3>次のステップ</h3>
                <ol>
                    <li>メール内の秘密鍵を確認</li>
                    <li>CMSにアクセスして想い出ページを作成</li>
                    <li>アクリルスタンドの制作・発送</li>
                </ol>
            </div>
            
            <div class="action-buttons">
                <a href="/" class="btn btn-secondary">トップページに戻る</a>
                <a href="/cms" class="btn btn-primary">CMSにアクセス</a>
            </div>
        </div>
    </div>
</body>
</html>
```

## 🎨 **CSSスタイル**

### **1. 決済ページスタイル**
```css
/* Payment Page Styles */
.payment-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.order-summary {
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-xl);
}

.product-info {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.product-image img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-gray-200);
}

.product-details h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.product-details p {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-secondary);
}

.shipping-summary {
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-xl);
}

.shipping-info p {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-secondary);
}

.total-summary {
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-xl);
}

.price-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.item-price,
.shipping-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-gray-200);
}

.total-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
}

.payment-section {
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.card-element-container {
  margin-bottom: var(--spacing-lg);
}

#submit-payment {
  width: 100%;
  padding: var(--spacing-lg);
  font-size: 1.125rem;
  font-weight: 600;
}
```

### **2. 成功ページスタイル**
```css
/* Success Page Styles */
.success-page {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-3xl) var(--spacing-xl);
}

.success-icon {
  color: var(--color-success);
  margin-bottom: var(--spacing-xl);
}

.success-page h1 {
  color: var(--color-success);
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.success-message {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.next-steps {
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-xl);
  text-align: left;
}

.next-steps h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.next-steps ol {
  margin: 0;
  padding-left: var(--spacing-lg);
}

.next-steps li {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.action-buttons .btn {
  min-width: 150px;
}
```

## 🚀 **実装優先度**

### **Phase 1: 基本決済ページ**
1. **決済前確認**: 注文内容、配送先、合計金額の表示
2. **Stripe決済**: 決済処理の実行
3. **成功ページ**: 決済完了後の表示

### **Phase 2: データ保存**
1. **注文データ保存**: Firestoreへの注文データ保存
2. **秘密鍵生成**: 決済完了後の秘密鍵生成
3. **メール送信**: 秘密鍵とCMSリンクの送信

### **Phase 3: システム連携**
1. **CMS連携**: 決済完了後のCMSアクセス
2. **顧客管理システム**: 注文データの管理
3. **NFCライティングアプリ**: 配送先情報の連携

## 💡 **メリット**

### **1. ユーザー体験**
- **明確な確認**: 決済前に注文内容を確認
- **安心感**: 写真、配送先、金額の最終確認
- **スムーズな決済**: 段階的入力からの自然な流れ

### **2. ビジネス**
- **コンバージョン向上**: 決済前の最終確認で離脱防止
- **データ品質**: 決済前のデータ検証
- **顧客満足**: 透明性の高い決済プロセス

**商品決済ページの実装を進めますか？**
