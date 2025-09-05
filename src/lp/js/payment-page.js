/**
 * 決済ページ
 * 決済前確認とStripe決済処理
 */

// Stripe設定
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51Rl1GKLxm2EHJLr5ySCvOzMTpLfjGRgC9aPnLmKHtQsI2bqw84jnSEh77qCB7easAxkknZNaaSk01d6SrVBUMqig00FWkcht3q';

// Stripeインスタンス
let stripe;
let cardElement;

// 決済データ
let paymentData = {
  orderId: null,
  productInfo: null,
  customerInfo: null,
  photo: null, // 1枚のみ
  totalAmount: 0
};

/**
 * 決済ページ初期化
 */
async function initializePaymentPage() {
  try {
    console.log('🔄 決済ページ初期化開始');
    
    // 注文データを取得
    loadOrderData();
    
    // 決済前確認を表示
    displayOrderSummary();
    
    // Stripe決済を初期化
    await initializeStripePayment();
    
    console.log('✅ 決済ページ初期化完了');
    
  } catch (error) {
    console.error('❌ 決済ページ初期化エラー:', error);
    showError('ページの初期化に失敗しました。ページを再読み込みしてください。');
  }
}

/**
 * 注文データを読み込み
 */
function loadOrderData() {
  try {
    // ローカルストレージから注文データを取得
    const orderData = localStorage.getItem('orderData');
    if (orderData) {
      paymentData = JSON.parse(orderData);
      console.log('✅ 注文データ読み込み完了:', paymentData);
    } else {
      throw new Error('注文データが見つかりません');
    }
  } catch (error) {
    console.error('❌ 注文データ読み込みエラー:', error);
    showError('注文データが見つかりません。最初からやり直してください。');
  }
}

/**
 * 注文内容を表示
 */
function displayOrderSummary() {
  try {
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
    if (photoPreview && paymentData.photo) {
      photoPreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = paymentData.photo.url || paymentData.photo;
      img.alt = 'アップロードされた写真';
      img.style.width = '200px';
      img.style.height = '200px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.border = '2px solid var(--color-gray-200)';
      photoPreview.appendChild(img);
    } else {
      photoPreview.innerHTML = '<p>写真がアップロードされていません</p>';
    }
    
    // 配送先情報
    const shippingInfo = document.getElementById('shippingInfo');
    if (shippingInfo && paymentData.customerInfo && paymentData.customerInfo.shippingInfo) {
      const shipping = paymentData.customerInfo.shippingInfo;
      shippingInfo.innerHTML = `
        <p><strong>${shipping.name}</strong></p>
        <p>〒${shipping.postalCode}</p>
        <p>${shipping.prefecture}${shipping.city}${shipping.address1}</p>
        ${shipping.address2 ? `<p>${shipping.address2}</p>` : ''}
        ${shipping.phone ? `<p>電話: ${shipping.phone}</p>` : ''}
      `;
    }
    
    // 合計金額
    const itemPrice = document.getElementById('itemPrice');
    const totalAmount = document.getElementById('totalAmount');
    const paymentButtonText = document.getElementById('paymentButtonText');
    
    if (paymentData.productInfo) {
      const price = paymentData.productInfo.price;
      if (itemPrice) itemPrice.textContent = `¥${price.toLocaleString()}`;
      if (totalAmount) totalAmount.textContent = `¥${price.toLocaleString()}`;
      if (paymentButtonText) paymentButtonText.textContent = `¥${price.toLocaleString()}で決済する`;
    }
    
    console.log('✅ 注文内容表示完了');
    
  } catch (error) {
    console.error('❌ 注文内容表示エラー:', error);
    showError('注文内容の表示に失敗しました。');
  }
}

/**
 * Stripe決済を初期化
 */
async function initializeStripePayment() {
  try {
    // Stripeインスタンス作成
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    
    // Elements作成
    const elements = stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#007bff',
          colorBackground: '#ffffff',
          colorText: '#30313d',
          colorDanger: '#df1b41',
          fontFamily: 'system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        }
      }
    });
    
    // カード要素作成
    cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#9e2146',
        },
      },
    });
    
    // カード要素をマウント
    cardElement.mount('#card-element');
    
    // エラーハンドリング
    cardElement.on('change', ({ error }) => {
      const displayError = document.getElementById('card-errors');
      if (error) {
        displayError.textContent = error.message;
        displayError.style.display = 'block';
      } else {
        displayError.textContent = '';
        displayError.style.display = 'none';
      }
    });
    
    console.log('✅ Stripe決済初期化完了');
    
  } catch (error) {
    console.error('❌ Stripe決済初期化エラー:', error);
    showError('決済システムの初期化に失敗しました。');
  }
}

/**
 * 決済処理
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
    
    console.log('🔄 決済処理開始');
    
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
          photo: paymentData.photo ? 1 : 0
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Payment Intent作成完了');
      
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
        console.log('✅ 決済完了');
        await handlePaymentSuccess(data.paymentIntentId);
      }
    } else {
      throw new Error(data.error);
    }
    
  } catch (error) {
    console.error('❌ 決済エラー:', error);
    showError('決済に失敗しました: ' + error.message);
    
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
    console.log('🔄 決済成功処理開始');
    
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
      console.log('✅ 注文データ保存完了');
      
      // 成功ページにリダイレクト
      window.location.href = `/payment-success.html?orderId=${orderData.orderId}`;
    } else {
      throw new Error(orderData.error);
    }
    
  } catch (error) {
    console.error('❌ 決済成功処理エラー:', error);
    showError('注文の保存に失敗しました。お問い合わせください。');
  }
}

/**
 * エラーメッセージ表示
 */
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    background: #fee;
    color: #c33;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    border: 1px solid #fcc;
  `;
  
  const container = document.querySelector('.container');
  container.insertBefore(errorDiv, container.firstChild);
  
  // 5秒後に自動削除
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

/**
 * 決済ボタンイベント
 */
document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submit-payment');
  if (submitBtn) {
    submitBtn.addEventListener('click', processPayment);
  }
});

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', initializePaymentPage);
