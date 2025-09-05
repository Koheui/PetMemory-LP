/**
 * 決済成功ページ
 * 注文情報の表示とCMSアクセス
 */

// 注文データ
let orderData = null;

/**
 * 決済成功ページ初期化
 */
function initializeSuccessPage() {
  try {
    console.log('🔄 決済成功ページ初期化開始');
    
    // URLパラメータから注文IDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
      // 注文データを取得
      loadOrderData(orderId);
    } else {
      // ローカルストレージから注文データを取得
      loadOrderDataFromStorage();
    }
    
    console.log('✅ 決済成功ページ初期化完了');
    
  } catch (error) {
    console.error('❌ 決済成功ページ初期化エラー:', error);
    showError('ページの初期化に失敗しました。');
  }
}

/**
 * 注文データを取得
 */
async function loadOrderData(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    const data = await response.json();
    
    if (data.success) {
      orderData = data.data;
      displayOrderInfo();
    } else {
      throw new Error(data.error);
    }
    
  } catch (error) {
    console.error('❌ 注文データ取得エラー:', error);
    // フォールバック: ローカルストレージから取得
    loadOrderDataFromStorage();
  }
}

/**
 * ローカルストレージから注文データを取得
 */
function loadOrderDataFromStorage() {
  try {
    const storedData = localStorage.getItem('orderData');
    if (storedData) {
      orderData = JSON.parse(storedData);
      displayOrderInfo();
    } else {
      showError('注文データが見つかりません。');
    }
  } catch (error) {
    console.error('❌ ローカルストレージ読み込みエラー:', error);
    showError('注文データの読み込みに失敗しました。');
  }
}

/**
 * 注文情報を表示
 */
function displayOrderInfo() {
  try {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails || !orderData) return;
    
    let html = '';
    
    // 商品情報
    if (orderData.productInfo) {
      html += `
        <div class="order-item">
          <h4>商品情報</h4>
          <p><strong>NFC付きアクリルスタンド</strong></p>
          <p>サイズ: ${orderData.productInfo.size}</p>
          <p>価格: ¥${orderData.productInfo.price.toLocaleString()}</p>
        </div>
      `;
    }
    
    // 配送先情報
    if (orderData.customerInfo && orderData.customerInfo.shippingInfo) {
      const shipping = orderData.customerInfo.shippingInfo;
      html += `
        <div class="order-item">
          <h4>配送先</h4>
          <p><strong>${shipping.name}</strong></p>
          <p>〒${shipping.postalCode}</p>
          <p>${shipping.prefecture}${shipping.city}${shipping.address1}</p>
          ${shipping.address2 ? `<p>${shipping.address2}</p>` : ''}
        </div>
      `;
    }
    
    // 写真情報
    if (orderData.photos && orderData.photos.length > 0) {
      html += `
        <div class="order-item">
          <h4>アップロードされた写真</h4>
          <p>${orderData.photos.length}枚の写真がアップロードされています</p>
        </div>
      `;
    }
    
    orderDetails.innerHTML = html;
    
    // CMSリンクを表示（秘密鍵が生成された場合）
    const cmsLink = document.getElementById('cmsLink');
    if (cmsLink && orderData.secretKey) {
      cmsLink.href = `/cms?secretKey=${orderData.secretKey}`;
      cmsLink.style.display = 'inline-block';
    }
    
    console.log('✅ 注文情報表示完了');
    
  } catch (error) {
    console.error('❌ 注文情報表示エラー:', error);
    showError('注文情報の表示に失敗しました。');
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
}

/**
 * メール送信状況をチェック
 */
function checkEmailStatus() {
  // 5秒後にメール送信状況をチェック
  setTimeout(async () => {
    try {
      if (orderData && orderData.orderId) {
        const response = await fetch(`/api/orders/${orderData.orderId}/email-status`);
        const data = await response.json();
        
        if (data.success && data.emailSent) {
          // メール送信完了
          showEmailSentMessage();
        }
      }
    } catch (error) {
      console.error('メール送信状況チェックエラー:', error);
    }
  }, 5000);
}

/**
 * メール送信完了メッセージ
 */
function showEmailSentMessage() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'alert alert-success';
  messageDiv.innerHTML = `
    <strong>メール送信完了</strong><br>
    秘密鍵がメールで送信されました。受信ボックスをご確認ください。
  `;
  messageDiv.style.cssText = `
    background: #efe;
    color: #363;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    border: 1px solid #cfc;
  `;
  
  const container = document.querySelector('.container');
  container.insertBefore(messageDiv, container.firstChild);
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  initializeSuccessPage();
  checkEmailStatus();
});
