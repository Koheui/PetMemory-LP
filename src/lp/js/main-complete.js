/**
 * 想い出リンク LP - 完全版JavaScript
 * 簡易版をベースに完全版の機能を追加
 */

console.log('🚀 完全版JavaScript読み込み開始');

// ページ読み込み完了確認
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded イベント発火');
});

window.addEventListener('load', () => {
  console.log('🌐 window load イベント発火');
});

// ================================
// 設定 (v1.1仕様対応)
// ================================
const CONFIG = {
  // 環境変数から取得（通常のJavaScript形式）
  CMS_API_BASE: window.VITE_CMS_API_BASE || 'http://localhost:5001',
  RECAPTCHA_SITE_KEY: window.VITE_RECAPTCHA_SITE_KEY || '66LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S',
  TENANT_ID: window.VITE_TENANT_ID || 'petmem',
  LP_ID: window.VITE_LP_ID || 'direct',
  
  // API エンドポイント
  API_ENDPOINT: '/api-gate-lp-form',
  
  // バリデーション設定
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // UI設定
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300
};

console.log('⚙️ 設定読み込み完了:', CONFIG);

// ================================
// DOM要素の取得
// ================================
const elements = {
  form: document.getElementById('orderForm'),
  emailInput: document.getElementById('email'),
  submitBtn: document.getElementById('submitBtn'),
  btnText: document.querySelector('.btn-text'),
  spinner: document.getElementById('spinner'),
  successMessage: document.getElementById('successMessage'),
  generalError: document.getElementById('generalError'),
  emailError: document.getElementById('emailError')
};

console.log('🔍 DOM要素取得状況:', {
  form: !!elements.form,
  emailInput: !!elements.emailInput,
  submitBtn: !!elements.submitBtn,
  btnText: !!elements.btnText,
  spinner: !!elements.spinner,
  successMessage: !!elements.successMessage,
  generalError: !!elements.generalError,
  emailError: !!elements.emailError
});

// ================================
// ユーティリティ関数
// ================================

/**
 * デバウンス関数
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 要素の表示/非表示を切り替え
 * @param {HTMLElement} element - 対象要素
 * @param {boolean} show - 表示するかどうか
 */
function toggleElement(element, show) {
  if (!element) return;
  element.style.display = show ? 'block' : 'none';
}

/**
 * エラーメッセージを表示
 * @param {HTMLElement} element - エラー要素
 * @param {string} message - エラーメッセージ
 */
function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.style.display = 'block';
}

/**
 * エラーメッセージをクリア
 * @param {HTMLElement} element - エラー要素
 */
function clearError(element) {
  if (!element) return;
  element.textContent = '';
  element.style.display = 'none';
}

// ================================
// バリデーション
// ================================

/**
 * メールアドレスのバリデーション
 * @param {string} email - メールアドレス
 * @returns {object} バリデーション結果
 */
function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'メールアドレスを入力してください' };
  }
  
  if (!CONFIG.EMAIL_PATTERN.test(email)) {
    return { isValid: false, message: '正しいメールアドレスを入力してください' };
  }
  
  return { isValid: true };
}

/**
 * フォームのバリデーション
 * @param {FormData} formData - フォームデータ
 * @returns {object} バリデーション結果
 */
function validateForm(formData) {
  const email = formData.get('email');
  const validation = validateEmail(email);
  
  if (!validation.isValid) {
    return { isValid: false, field: 'email', message: validation.message };
  }
  
  return { isValid: true };
}

// ================================
// reCAPTCHA
// ================================

/**
 * reCAPTCHA トークン取得
 * @returns {Promise<string>} reCAPTCHA トークン
 */
async function getRecaptchaToken() {
  console.log('🔍 reCAPTCHA トークン取得開始');
  console.log('🔑 reCAPTCHA サイトキー:', CONFIG.RECAPTCHA_SITE_KEY);
  console.log('🌐 grecaptcha オブジェクト:', typeof grecaptcha);
  
  try {
    if (typeof grecaptcha === 'undefined') {
      console.warn('❌ reCAPTCHA is not loaded, using test token');
      return 'test-token';
    }
    
    console.log('✅ grecaptcha オブジェクト確認完了');
    console.log('🔧 grecaptcha.ready:', typeof grecaptcha.ready);
    console.log('🔧 grecaptcha.execute:', typeof grecaptcha.execute);
    
    // grecaptchaが既に準備済みかチェック
    if (grecaptcha && grecaptcha.execute) {
      console.log('✅ grecaptcha 既に準備済み、直接実行');
      
      console.log('⏳ grecaptcha.execute() 実行中...');
      const token = await grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, {
        action: 'lp_form'
      });
      
      console.log('✅ reCAPTCHA トークン取得成功:', token ? token.substring(0, 20) + '...' : 'null');
      return token;
    } else {
      console.log('⏳ grecaptcha.ready() 実行中...');
      await grecaptcha.ready();
      console.log('✅ grecaptcha.ready() 完了');
      
      console.log('⏳ grecaptcha.execute() 実行中...');
      const token = await grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, {
        action: 'lp_form'
      });
      
      console.log('✅ reCAPTCHA トークン取得成功:', token ? token.substring(0, 20) + '...' : 'null');
      return token;
    }
  } catch (error) {
    console.error('❌ reCAPTCHA error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.warn('⚠️ Using test token due to reCAPTCHA error');
    return 'test-token';
  }
}

// ================================
// API通信
// ================================

/**
 * LP form API への送信 (v1.1仕様)
 * @param {object} data - 送信データ
 * @returns {Promise<object>} APIレスポンス
 */
async function submitToAPI(data) {
  try {
    const fullUrl = `${CONFIG.CMS_API_BASE}${CONFIG.API_ENDPOINT}`;
    console.log('🔗 API URL:', fullUrl);
    console.log('📤 送信データ:', data);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error('API error:', error);
    
    // ネットワークエラーの場合
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('ネットワークエラーが発生しました。インターネット接続をご確認ください。');
    }
    
    // CORS エラーの場合
    if (error.message.includes('CORS')) {
      throw new Error('接続エラーが発生しました。しばらく時間をおいて再度お試しください。');
    }
    
    throw error;
  }
}

// ================================
// フォーム処理
// ================================

/**
 * 送信ボタンの状態を変更
 * @param {boolean} isLoading - ローディング状態
 */
function setSubmitButtonState(isLoading) {
  if (!elements.submitBtn || !elements.btnText || !elements.spinner) return;
  
  elements.submitBtn.disabled = isLoading;
  
  if (isLoading) {
    elements.btnText.style.display = 'none';
    elements.spinner.style.display = 'flex';
    elements.submitBtn.style.opacity = '0.8';
  } else {
    elements.btnText.style.display = 'block';
    elements.spinner.style.display = 'none';
    elements.submitBtn.style.opacity = '1';
  }
}

/**
 * 成功メッセージを表示
 */
function showSuccess() {
  console.log('🎯 showSuccess関数が呼び出されました');
  
  // フォームを非表示
  if (elements.form) {
    elements.form.style.cssText = 'display: none !important;';
    console.log('📝 フォームを非表示にしました');
  } else {
    console.error('❌ フォーム要素が見つかりません');
  }
  
  // 成功メッセージを表示
  if (elements.successMessage) {
    console.log('🔍 成功メッセージ要素の現在の状態:', {
      display: elements.successMessage.style.display,
      opacity: elements.successMessage.style.opacity,
      visibility: elements.successMessage.style.visibility
    });
    
    elements.successMessage.style.cssText = `
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      position: relative !important;
      z-index: 1000 !important;
      background-color: #f0fdf4 !important;
      border: 2px solid #22c55e !important;
      border-radius: 12px !important;
      padding: 24px !important;
      text-align: center !important;
      margin-top: 20px !important;
    `;
    console.log('✅ 成功メッセージを表示しました');
    
    // 成功メッセージを画面の中央にスクロール
    elements.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    console.error('❌ 成功メッセージ要素が見つかりません');
  }
}

/**
 * フォーム送信処理
 * @param {Event} event - フォームイベント
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  console.log('📝 フォーム送信開始');
  
  // エラーメッセージをクリア
  clearError(elements.emailError);
  clearError(elements.generalError);
  
  // ローディング状態に変更
  setSubmitButtonState(true);
  
  try {
    // フォームデータを取得
    const formData = new FormData(elements.form);
    
    // バリデーション
    const validation = validateForm(formData);
    if (!validation.isValid) {
      const errorElement = validation.field === 'email' ? elements.emailError : elements.generalError;
      showError(errorElement, validation.message);
      
      // 該当するinputにフォーカス
      if (validation.field === 'email' && elements.emailInput) {
        elements.emailInput.focus();
        elements.emailInput.classList.add('error');
        setTimeout(() => elements.emailInput.classList.remove('error'), 3000);
      }
      
      return;
    }
    
    console.log('✅ バリデーション成功:', formData.get('email'));
    
    // reCAPTCHA トークン取得
    console.log('🔄 reCAPTCHA トークン取得開始');
    const recaptchaToken = await getRecaptchaToken();
    console.log('🔄 reCAPTCHA トークン取得完了:', recaptchaToken ? recaptchaToken.substring(0, 20) + '...' : 'null');
    
    // API送信データを構築 (v1.1仕様)
    const submitData = {
      email: formData.get('email').trim(),
      tenant: CONFIG.TENANT_ID,
      lpId: CONFIG.LP_ID,
      productType: 'acrylic',
      recaptchaToken: recaptchaToken
    };
    
    // API呼び出し (v1.1仕様)
    console.log('🌐 API送信開始:', submitData);
    const result = await submitToAPI(submitData);
    
    // 成功時の処理
    console.log('✅ フォーム送信成功:', result);
    showSuccess();
    
    // Google Analytics イベント送信（設定されている場合）
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submit', {
        event_category: 'engagement',
        event_label: 'lp_form'
      });
    }
    
  } catch (error) {
    console.error('Form submission error:', error);
    showError(elements.generalError, error.message || 'エラーが発生しました。しばらく時間をおいて再度お試しください。');
    
    // Google Analytics エラーイベント送信（設定されている場合）
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_error', {
        event_category: 'error',
        event_label: error.message || 'unknown_error'
      });
    }
    
  } finally {
    // ローディング状態を解除
    setSubmitButtonState(false);
  }
}

// ================================
// リアルタイムバリデーション
// ================================

/**
 * メールアドレス入力のリアルタイムバリデーション
 */
const handleEmailInput = debounce((event) => {
  const email = event.target.value;
  
  // 空の場合はエラーをクリア
  if (!email || email.trim() === '') {
    clearError(elements.emailError);
    elements.emailInput.classList.remove('error');
    return;
  }
  
  // バリデーション実行
  const validation = validateEmail(email);
  
  if (validation.isValid) {
    clearError(elements.emailError);
    elements.emailInput.classList.remove('error');
  } else {
    showError(elements.emailError, validation.message);
    elements.emailInput.classList.add('error');
  }
}, CONFIG.DEBOUNCE_DELAY);

// ================================
// イベントリスナー設定
// ================================

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  console.log('🎧 イベントリスナー設定開始');
  
  // フォーム送信
  if (elements.form) {
    console.log('✅ フォーム送信イベントリスナー設定');
    elements.form.addEventListener('submit', handleFormSubmit);
  } else {
    console.error('❌ フォーム要素が見つかりません');
  }
  
  // メールアドレス入力のリアルタイムバリデーション
  if (elements.emailInput) {
    elements.emailInput.addEventListener('input', handleEmailInput);
    
    // フォーカス時にエラー状態をクリア
    elements.emailInput.addEventListener('focus', () => {
      elements.emailInput.classList.remove('error');
    });
  }
  
  // 送信ボタンの直接クリックイベントも追加
  if (elements.submitBtn) {
    console.log('🎯 送信ボタンクリックテスト設定');
    
    // 直接クリックイベントも追加
    elements.submitBtn.addEventListener('click', (event) => {
      console.log('🖱️ 送信ボタンがクリックされました');
      // フォーム送信を手動でトリガー
      if (elements.form) {
        elements.form.dispatchEvent(new Event('submit', { bubbles: true }));
      }
    });
    
    // ボタンの状態確認
    console.log('🔍 送信ボタンの状態:', {
      disabled: elements.submitBtn.disabled,
      type: elements.submitBtn.type,
      textContent: elements.submitBtn.textContent,
      style: {
        pointerEvents: elements.submitBtn.style.pointerEvents,
        opacity: elements.submitBtn.style.opacity,
        cursor: elements.submitBtn.style.cursor
      }
    });
  } else {
    console.error('❌ 送信ボタン要素が見つかりません');
  }
}

// ================================
// 初期化
// ================================

/**
 * 初期化処理
 */
function initialize() {
  console.log('想い出リンク LP - 完全版JavaScript initialized');
  
  // DOM要素の存在確認
  const requiredElements = ['form', 'emailInput', 'submitBtn'];
  const missingElements = requiredElements.filter(key => !elements[key]);
  
  if (missingElements.length > 0) {
    console.warn('Missing required DOM elements:', missingElements);
  }
  
  // イベントリスナー設定
  setupEventListeners();
  
  // reCAPTCHA読み込み確認
  if (typeof grecaptcha === 'undefined') {
    console.warn('reCAPTCHA is not loaded. Form submission may fail.');
  }
}

console.log('✅ 完全版JavaScript初期化完了');

// 初期化実行
initialize();
