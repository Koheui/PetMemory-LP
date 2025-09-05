/**
 * 段階的入力システム
 * 5ステップの入力フローを管理
 */

// ステップ管理
let currentStep = 1;
const totalSteps = 5;

// 入力データ
let orderData = {
  selectedSize: null,
  selectedPrice: null,
  basicInfo: {
    email: '',
    phone: ''
  },
  photos: [],
  shippingInfo: {
    name: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address1: '',
    address2: '',
    phone: ''
  },
  billingInfo: {
    sameAsShipping: true,
    name: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address1: '',
    address2: ''
  }
};

/**
 * ステップインジケーターを更新
 */
function updateStepIndicator() {
  const steps = document.querySelectorAll('.step');
  const progressBar = document.getElementById('progressBar');
  
  steps.forEach((step, index) => {
    const stepNumber = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNumber < currentStep) {
      step.classList.add('completed');
    } else if (stepNumber === currentStep) {
      step.classList.add('active');
    }
  });
  
  // プログレスバー更新
  const progress = (currentStep / totalSteps) * 100;
  progressBar.style.width = `${progress}%`;
}

/**
 * ステップを表示
 */
function showStep(stepNumber) {
  // 全ステップを非表示
  const steps = document.querySelectorAll('.step-content');
  steps.forEach(step => step.style.display = 'none');
  
  // 指定されたステップを表示
  const targetStep = document.getElementById(`step-${stepNumber}`);
  if (targetStep) {
    targetStep.style.display = 'block';
  }
  
  currentStep = stepNumber;
  updateStepIndicator();
  updateNavigationButtons();
}

/**
 * ナビゲーションボタンを更新
 */
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  
  if (prevBtn) {
    prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
  }
  
  if (nextBtn) {
    nextBtn.style.display = currentStep < totalSteps ? 'inline-block' : 'none';
  }
  
  if (submitBtn) {
    submitBtn.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
  }
}

/**
 * 次のステップに進む
 */
function nextStep() {
  if (currentStep < totalSteps) {
    showStep(currentStep + 1);
  }
}

/**
 * 前のステップに戻る
 */
function prevStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

/**
 * 段階的入力フローを開始
 */
function startStepInputFlow() {
  // 段階的入力フォームを表示
  const orderSection = document.getElementById('order');
  if (orderSection) {
    orderSection.style.display = 'block';
    orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // ステップ1（サイズ選択）を表示
    showStep(1);
  }
}

/**
 * ステップ1: サイズ選択
 */
function initializeStep1() {
  // 既存の価格選択ボタンのイベントリスナーを更新
  const priceButtons = document.querySelectorAll('.price-btn');
  priceButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const size = button.dataset.size;
      const price = parseInt(button.dataset.price);
      
      // 選択状態の更新
      priceButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      
      // データ保存
      orderData.selectedSize = size;
      orderData.selectedPrice = price;
      
      // 段階的入力フローが開始されているかチェック
      const orderSection = document.getElementById('order');
      if (orderSection && orderSection.style.display === 'block') {
        // 段階的入力フロー内での処理
        nextStep();
      } else {
        // トップページからの処理：段階的入力フローを開始
        startStepInputFlow();
      }
    });
  });
}

/**
 * ステップ2: 基本情報入力
 */
function initializeStep2() {
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  
  if (emailInput) {
    emailInput.addEventListener('blur', (e) => {
      orderData.basicInfo.email = e.target.value;
    });
  }
  
  if (phoneInput) {
    phoneInput.addEventListener('blur', (e) => {
      orderData.basicInfo.phone = e.target.value;
    });
  }
}

/**
 * ステップ3: 写真アップロード
 */
function initializeStep3() {
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      orderData.photos = files;
      
      // プレビュー表示
      if (photoPreview) {
        photoPreview.innerHTML = '';
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.margin = '5px';
            img.style.borderRadius = '8px';
            photoPreview.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      }
    });
  }
}

/**
 * ステップ4: 配送先入力
 */
function initializeStep4() {
  const postalCodeInput = document.getElementById('postalCode');
  const sameAsShippingCheckbox = document.getElementById('sameAsShipping');
  const billingAddressFields = document.getElementById('billingAddressFields');
  
  // 郵便番号自動入力
  if (postalCodeInput) {
    postalCodeInput.addEventListener('blur', (e) => {
      const postalCode = e.target.value.replace(/-/g, '');
      if (postalCode.length === 7) {
        autoFillAddress(postalCode);
      }
    });
  }
  
  // 請求先住所の表示/非表示
  if (sameAsShippingCheckbox && billingAddressFields) {
    sameAsShippingCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        billingAddressFields.style.display = 'none';
        orderData.billingInfo.sameAsShipping = true;
      } else {
        billingAddressFields.style.display = 'block';
        orderData.billingInfo.sameAsShipping = false;
      }
    });
  }
  
  // 配送先情報の保存
  const shippingFields = ['name', 'postalCode', 'prefecture', 'city', 'address1', 'address2', 'phone'];
  shippingFields.forEach(field => {
    const input = document.getElementById(`shipping${field.charAt(0).toUpperCase() + field.slice(1)}`);
    if (input) {
      input.addEventListener('blur', (e) => {
        orderData.shippingInfo[field] = e.target.value;
      });
    }
  });
}

/**
 * ステップ5: 決済
 */
function initializeStep5() {
  // 決済ページへのリダイレクトを無効化
  // redirectToPaymentPage();
  console.log('ステップ5: 決済準備完了');
}

/**
 * 決済ページに遷移
 */
function redirectToPaymentPage() {
  // 決済ページへのリダイレクトを無効化
  console.log('決済ページへの遷移を無効化');
  return;
  
  try {
    // 注文データをローカルストレージに保存
    localStorage.setItem('orderData', JSON.stringify(orderData));
    
    // 決済ページに遷移
    window.location.href = '/payment.html';
    
  } catch (error) {
    console.error('決済ページ遷移エラー:', error);
    alert('決済ページへの遷移に失敗しました。');
  }
}

/**
 * 郵便番号から住所自動入力
 */
async function autoFillAddress(postalCode) {
  try {
    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
    const data = await response.json();
    
    if (data.status === 200 && data.results) {
      const result = data.results[0];
      const prefectureInput = document.getElementById('prefecture');
      const cityInput = document.getElementById('city');
      
      if (prefectureInput) prefectureInput.value = result.address1;
      if (cityInput) cityInput.value = result.address2 + result.address3;
    }
  } catch (error) {
    console.error('住所自動入力エラー:', error);
  }
}

/**
 * フォーム送信
 */
async function submitOrder() {
  try {
    console.log('注文データ:', orderData);
    
    // バリデーション
    if (!orderData.selectedSize || !orderData.selectedPrice) {
      alert('サイズを選択してください');
      return;
    }
    
    if (!orderData.basicInfo.email) {
      alert('メールアドレスを入力してください');
      return;
    }
    
    if (!orderData.shippingInfo.name || !orderData.shippingInfo.postalCode) {
      alert('配送先情報を入力してください');
      return;
    }
    
    // 決済処理
    await processPayment();
    
  } catch (error) {
    console.error('注文送信エラー:', error);
    alert('エラーが発生しました。もう一度お試しください。');
  }
}

/**
 * 決済処理
 */
async function processPayment() {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: orderData.basicInfo.email,
        amount: orderData.selectedPrice,
        metadata: {
          tenant: 'futurestudio',
          lpId: 'emolink.cloud',
          productType: 'acrylic-stand',
          selectedSize: orderData.selectedSize,
          shippingInfo: orderData.shippingInfo,
          photos: orderData.photos.length
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Stripe決済処理
      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: orderData.basicInfo.email,
            name: orderData.shippingInfo.name,
            address: {
              line1: orderData.shippingInfo.address1,
              city: orderData.shippingInfo.city,
              postal_code: orderData.shippingInfo.postalCode,
              country: 'JP'
            }
          }
        }
      });
      
      if (error) {
        console.error('決済エラー:', error);
        alert('決済に失敗しました: ' + error.message);
      } else {
        // 決済成功
        showSuccessMessage();
      }
    } else {
      throw new Error(data.error);
    }
    
  } catch (error) {
    console.error('決済処理エラー:', error);
    alert('決済処理中にエラーが発生しました');
  }
}

/**
 * 成功メッセージ表示
 */
function showSuccessMessage() {
  const successMessage = document.getElementById('successMessage');
  const orderForm = document.getElementById('orderForm');
  
  if (successMessage && orderForm) {
    orderForm.style.display = 'none';
    successMessage.style.display = 'block';
  }
}

/**
 * 初期化
 */
function initializeStepInput() {
  // ステップ1から開始
  showStep(1);
  
  // 各ステップの初期化（ステップ5は除く）
  initializeStep1();
  initializeStep2();
  initializeStep3();
  initializeStep4();
  // initializeStep5(); // ステップ5は手動で呼び出す
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', initializeStepInput);
