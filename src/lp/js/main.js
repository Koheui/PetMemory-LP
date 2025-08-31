/**
 * 想い出リンク LP - メインJavaScript
 * reCAPTCHA v3、フォームバリデーション、Firebase Functions API連携
 */

// ================================
// 設定 (v1.1仕様対応)
// ================================
const CONFIG = {
  // 環境変数から取得（Vite形式）
  CMS_API_BASE: import.meta.env?.VITE_CMS_API_BASE || 'http://localhost:5001',
  RECAPTCHA_SITE_KEY: import.meta.env?.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
  TENANT_ID: import.meta.env?.VITE_TENANT_ID || 'petmem',
  LP_ID: import.meta.env?.VITE_LP_ID || 'direct',
  
  // API エンドポイント
  API_ENDPOINT: '/api-gate-lp-form',
  
  // バリデーション設定
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // UI設定
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300
};

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

// デバッグ: 要素の取得状況を確認
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

// 送信ボタンの直接クリックイベントも追加
if (elements.submitBtn) {
  elements.submitBtn.addEventListener('click', (event) => {
    console.log('🖱️ 送信ボタンがクリックされました');
    // フォーム送信を手動でトリガー
    if (elements.form) {
      elements.form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  });
}

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
 * 滑らかなアニメーションで要素を表示/非表示
 * @param {HTMLElement} element - 対象要素
 * @param {boolean} show - 表示するかどうか
 */
function animateElement(element, show) {
  if (!element) return;
  
  if (show) {
    element.style.display = 'block';
    element.style.opacity = '0';
    element.style.transform = 'translateY(10px)';
    
    // フレームをスキップしてアニメーション開始
    requestAnimationFrame(() => {
      element.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease, transform ${CONFIG.ANIMATION_DURATION}ms ease`;
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  } else {
    element.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease, transform ${CONFIG.ANIMATION_DURATION}ms ease`;
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      element.style.display = 'none';
    }, CONFIG.ANIMATION_DURATION);
  }
}

/**
 * エラーメッセージを表示
 * @param {HTMLElement} errorElement - エラー表示要素
 * @param {string} message - エラーメッセージ
 */
function showError(errorElement, message) {
  if (!errorElement) return;
  errorElement.textContent = message;
  errorElement.style.color = '#ef4444';
  animateElement(errorElement, true);
}

/**
 * エラーメッセージをクリア
 * @param {HTMLElement} errorElement - エラー表示要素
 */
function clearError(errorElement) {
  if (!errorElement) return;
  animateElement(errorElement, false);
  setTimeout(() => {
    errorElement.textContent = '';
  }, CONFIG.ANIMATION_DURATION);
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
    return {
      isValid: false,
      message: 'メールアドレスを入力してください。'
    };
  }
  
  if (!CONFIG.EMAIL_PATTERN.test(email)) {
    return {
      isValid: false,
      message: '正しいメールアドレスの形式で入力してください。'
    };
  }
  
  if (email.length > 254) {
    return {
      isValid: false,
      message: 'メールアドレスが長すぎます。'
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
}

/**
 * フォーム全体のバリデーション
 * @param {FormData} formData - フォームデータ
 * @returns {object} バリデーション結果
 */
function validateForm(formData) {
  const email = formData.get('email');
  
  // メールアドレスのバリデーション
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return {
      isValid: false,
      field: 'email',
      message: emailValidation.message
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
}

// ================================
// reCAPTCHA
// ================================

/**
 * reCAPTCHA v3 トークンを取得 (v1.1仕様)
 * @returns {Promise<string>} reCAPTCHAトークン
 */
async function getRecaptchaToken() {
  try {
    if (typeof grecaptcha === 'undefined') {
      console.warn('reCAPTCHA is not loaded, using test token');
      return 'test-token';
    }
    
    await grecaptcha.ready();
    const token = await grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, {
      action: 'lp_form'
    });
    
    return token;
  } catch (error) {
    console.error('reCAPTCHA error:', error);
    console.warn('Using test token due to reCAPTCHA error');
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
  // フォームを非表示
  if (elements.form) {
    elements.form.style.cssText = 'display: none !important;';
    console.log('📝 フォームを非表示にしました');
  }
  
  // 成功メッセージを表示
  if (elements.successMessage) {
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
  }
}

/**
 * フォーム送信処理
 * @param {Event} event - フォームイベント
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
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
    
    // reCAPTCHA トークン取得
    const recaptchaToken = await getRecaptchaToken();
    
    // API送信データを構築 (v1.1仕様)
    const submitData = {
      email: formData.get('email').trim(),
      recaptchaToken: recaptchaToken
      // tenant/lpIdは送信するが、サーバ側では必ずOriginから再解決
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
// スムーススクロール
// ================================

/**
 * スムーススクロール処理
 * @param {Event} event - クリックイベント
 */
function handleSmoothScroll(event) {
  const href = event.target.getAttribute('href');
  
  // 内部リンクの場合のみ処理
  if (href && href.startsWith('#')) {
    event.preventDefault();
    
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
      const targetPosition = targetElement.offsetTop - navHeight - 20;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }
}

// ================================
// スクロールアニメーション
// ================================

/**
 * Intersection Observer でスクロールアニメーション
 */
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // アニメーション対象要素を監視
  const animatedElements = document.querySelectorAll('.service-card, .flow-step, .price-card');
  animatedElements.forEach(el => {
    el.classList.add('fade-in-on-scroll');
    observer.observe(el);
  });
}

// ================================
// 初期化
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
  
  // スムーススクロール
  document.addEventListener('click', (event) => {
    if (event.target.matches('a[href^="#"]')) {
      handleSmoothScroll(event);
    }
  });
  
  // ナビゲーションの背景透明度調整
  window.addEventListener('scroll', debounce(() => {
    const nav = document.querySelector('.nav');
    if (nav) {
      const scrolled = window.scrollY > 50;
      nav.style.backgroundColor = scrolled 
        ? 'rgba(255, 255, 255, 0.98)' 
        : 'rgba(255, 255, 255, 0.95)';
    }
  }, 10));
}

/**
 * DOMContentLoaded時の初期化
 */
function initialize() {
  console.log('想い出リンク LP - JavaScript initialized');
  
  // DOM要素の存在確認
  const requiredElements = ['form', 'emailInput', 'submitBtn'];
  const missingElements = requiredElements.filter(key => !elements[key]);
  
  if (missingElements.length > 0) {
    console.warn('Missing required DOM elements:', missingElements);
  }
  
  // イベントリスナー設定
  setupEventListeners();
  
  // スクロールアニメーション設定
  setupScrollAnimations();
  
  // reCAPTCHA読み込み確認
  if (typeof grecaptcha === 'undefined') {
    console.warn('reCAPTCHA is not loaded. Form submission may fail.');
  }
}

// ================================
// エラーハンドリング
// ================================

/**
 * グローバルエラーハンドラー
 */
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // 重要なエラーの場合はユーザーに通知
  if (event.error && event.error.message && 
      (event.error.message.includes('grecaptcha') || 
       event.error.message.includes('fetch'))) {
    showError(elements.generalError, 'システムエラーが発生しました。ページを再読み込みしてお試しください。');
  }
});

/**
 * Promise rejection ハンドラー
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // デフォルトのコンソール出力を防ぐ
});

// ================================
// 初期化実行
// ================================

// DOM読み込み完了時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
