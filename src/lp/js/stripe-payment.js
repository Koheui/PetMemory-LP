/**
 * Stripe決済機能
 * Secret Key v1.0仕様に基づく実装
 */

// Stripe設定
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51234567890abcdef'; // テスト用キー（本番では環境変数から取得）
const STRIPE_SECRET_KEY = 'sk_test_51234567890abcdef'; // テスト用キー（本番では環境変数から取得）

/**
 * エラーメッセージのマッピング
 */
const ERROR_MESSAGES = {
  'card_declined': 'カードが拒否されました。別のカードをお試しください。',
  'expired_card': 'カードの有効期限が切れています。',
  'incorrect_cvc': 'セキュリティコードが正しくありません。',
  'insufficient_funds': '残高が不足しています。',
  'invalid_expiry_month': '有効期限の月が無効です。',
  'invalid_expiry_year': '有効期限の年が無効です。',
  'invalid_number': 'カード番号が無効です。',
  'processing_error': '決済処理中にエラーが発生しました。しばらくしてから再試行してください。',
  'rate_limit': 'リクエストが多すぎます。しばらくしてから再試行してください。',
  'authentication_required': '3Dセキュア認証が必要です。',
  'generic_decline': 'カードが拒否されました。',
  'lost_card': 'カードが紛失として報告されています。',
  'stolen_card': 'カードが盗難として報告されています。',
  'try_again_later': 'しばらくしてから再試行してください。',
  'withdrawal_count_limit_exceeded': '引き出し回数制限を超えました。'
};

/**
 * Stripeエラーを日本語メッセージに変換
 */
function getErrorMessage(error) {
  if (error.type === 'card_error') {
    return ERROR_MESSAGES[error.code] || error.message;
  } else if (error.type === 'validation_error') {
    return '入力内容に問題があります。確認してください。';
  } else if (error.type === 'api_error') {
    return 'システムエラーが発生しました。しばらくしてから再試行してください。';
  } else {
    return error.message || '予期しないエラーが発生しました。';
  }
}

// DOM要素
const elements_ui = {
  form: null,
  emailInput: null,
  submitBtn: null,
  submitText: null,
  spinner: null,
  cardElement: null,
  cardErrors: null,
  emailError: null,
  generalError: null,
  successMessage: null
};

// 選択された価格情報
let selectedPrice = {
  size: null,
  price: null
};

/**
 * 初期化
 */
async function initializeStripe() {
  try {
    console.log('🔄 Stripe初期化開始');
    
    // Stripeインスタンス作成
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    
    // Elements作成
    elements = stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#2563eb',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
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
          color: '#1f2937',
          '::placeholder': {
            color: '#9ca3af',
          },
        },
        invalid: {
          color: '#ef4444',
        },
      },
    });
    
    // DOM要素取得
    elements_ui.form = document.getElementById('orderForm');
    elements_ui.emailInput = document.getElementById('email');
    elements_ui.submitBtn = document.getElementById('submitBtn');
    elements_ui.submitText = document.getElementById('submitText');
    elements_ui.spinner = document.getElementById('spinner');
    elements_ui.cardElement = document.getElementById('card-element');
    elements_ui.cardErrors = document.getElementById('card-errors');
    elements_ui.emailError = document.getElementById('emailError');
    elements_ui.generalError = document.getElementById('generalError');
    elements_ui.successMessage = document.getElementById('successMessage');

    // 価格選択ボタンのイベントリスナー
    const priceButtons = document.querySelectorAll('.price-btn');
    priceButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const size = button.dataset.size;
        const price = parseInt(button.dataset.price);
        
        // 選択状態の更新
        priceButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        // 選択された価格の保存
        selectedPrice = { size, price };
        
        // 送信ボタンの更新
        elements_ui.submitText.textContent = `¥${price.toLocaleString()}で申し込む`;
        elements_ui.submitBtn.disabled = false;
        
        // フォームにスクロール
        document.getElementById('order').scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      });
    });

    // 初期状態では送信ボタンを無効化
    elements_ui.submitBtn.disabled = true;
    
    // カード要素をマウント
    cardElement.mount(elements_ui.cardElement);
    
    // イベントリスナー設定
    setupEventListeners();
    
    console.log('✅ Stripe初期化完了');
    
  } catch (error) {
    console.error('❌ Stripe初期化エラー:', error);
    showError(elements_ui.generalError, '決済システムの初期化に失敗しました');
  }
}

/**
 * イベントリスナー設定
 */
function setupEventListeners() {
  // フォーム送信
  elements_ui.form.addEventListener('submit', handleFormSubmit);
  
  // カード要素の変更イベント
  cardElement.on('change', handleCardChange);
  
  // カード要素のエラーイベント
  cardElement.on('error', handleCardError);
}

/**
 * カード要素の変更処理
 */
function handleCardChange(event) {
  if (event.error) {
    showError(elements_ui.cardErrors, event.error.message);
  } else {
    clearError(elements_ui.cardErrors);
  }
}

/**
 * カード要素のエラー処理
 */
function handleCardError(event) {
  showError(elements_ui.cardErrors, event.error.message);
}

/**
 * フォーム送信処理
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  console.log('💳 決済処理開始');
  
  // エラーメッセージをクリア
  clearError(elements_ui.emailError);
  clearError(elements_ui.cardErrors);
  clearError(elements_ui.generalError);
  
  // ローディング状態に変更
  setSubmitButtonState(true);
  
  try {
    // 価格選択の確認
    if (!selectedPrice.size || !selectedPrice.price) {
      showError(elements_ui.generalError, 'サイズを選択してください');
      return;
    }
    
    // フォームデータを取得
    const formData = new FormData(elements_ui.form);
    const email = formData.get('email').trim();
    
    // バリデーション
    const validation = validateForm(formData);
    if (!validation.isValid) {
      const errorElement = validation.field === 'email' ? elements_ui.emailError : elements_ui.generalError;
      showError(errorElement, validation.message);
      return;
    }
    
    // reCAPTCHA トークン取得
    const recaptchaToken = await getRecaptchaToken();
    
    // Payment Intent作成
    const paymentIntent = await createPaymentIntent(email, recaptchaToken, selectedPrice);
    
    // Stripe決済確認
    const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
      paymentIntent.client_secret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email,
          },
        },
      }
    );
    
    if (error) {
      console.error('❌ 決済エラー:', error);
      const errorMessage = getErrorMessage(error);
      showError(elements_ui.cardErrors, errorMessage);
      return;
    }
    
    if (confirmedPaymentIntent.status === 'succeeded') {
      console.log('✅ 決済成功:', confirmedPaymentIntent);
      showSuccess();
    } else {
      console.error('❌ 決済失敗:', confirmedPaymentIntent.status);
      showError(elements_ui.generalError, '決済が完了しませんでした');
    }
    
  } catch (error) {
    console.error('❌ 決済処理エラー:', error);
    showError(elements_ui.generalError, '決済処理中にエラーが発生しました');
  } finally {
    setSubmitButtonState(false);
  }
}

/**
 * Payment Intent作成
 */
async function createPaymentIntent(email, recaptchaToken) {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      amount: 4980, // ¥4,980
      currency: 'jpy',
      recaptchaToken: recaptchaToken,
      metadata: {
        tenant: window.VITE_TENANT_ID || 'petmem',
        lpId: window.VITE_LP_ID || 'direct',
        productType: 'acrylic'
      }
    })
  });
  
  if (!response.ok) {
    throw new Error('Payment Intent作成に失敗しました');
  }
  
  return await response.json();
}

/**
 * フォームバリデーション
 */
function validateForm(formData) {
  const email = formData.get('email').trim();
  
  if (!email) {
    return { isValid: false, field: 'email', message: 'メールアドレスを入力してください' };
  }
  
  if (!validateEmail(email)) {
    return { isValid: false, field: 'email', message: '有効なメールアドレスを入力してください' };
  }
  
  return { isValid: true };
}

/**
 * メールアドレスバリデーション
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * reCAPTCHA トークン取得
 */
async function getRecaptchaToken() {
  return new Promise((resolve, reject) => {
    if (typeof grecaptcha === 'undefined') {
      reject(new Error('reCAPTCHA is not loaded'));
      return;
    }
    
    grecaptcha.ready(() => {
      grecaptcha.execute('6LeCp7wrAAAAACXaot0OR0ClPJ-jeM7f17OpfkoX', { action: 'payment' })
        .then(resolve)
        .catch(reject);
    });
  });
}

/**
 * 送信ボタンの状態変更
 */
function setSubmitButtonState(isLoading) {
  if (isLoading) {
    elements_ui.submitBtn.disabled = true;
    elements_ui.spinner.style.display = 'inline';
    elements_ui.submitBtn.querySelector('.btn-text').style.display = 'none';
  } else {
    elements_ui.submitBtn.disabled = false;
    elements_ui.spinner.style.display = 'none';
    elements_ui.submitBtn.querySelector('.btn-text').style.display = 'inline';
  }
}

/**
 * エラーメッセージ表示
 */
function showError(element, message) {
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

/**
 * エラーメッセージクリア
 */
function clearError(element) {
  if (element) {
    element.textContent = '';
    element.style.display = 'none';
  }
}

/**
 * 成功メッセージ表示
 */
function showSuccess() {
  if (elements_ui.successMessage) {
    elements_ui.form.style.display = 'none';
    elements_ui.successMessage.style.display = 'block';
    elements_ui.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Payment Intent作成
 */
async function createPaymentIntent(email, recaptchaToken, selectedPrice) {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: selectedPrice.price,
      currency: 'jpy',
      email: email,
      tenant: 'petmem',
      lpId: 'direct',
      productType: 'acrylic',
      productSize: selectedPrice.size,
      recaptchaToken: recaptchaToken
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Payment Intent作成に失敗しました');
  }

  return await response.json();
}
