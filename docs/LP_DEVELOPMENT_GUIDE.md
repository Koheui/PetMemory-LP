# 📝 LP開発ガイド - 成功パターン

## 🎯 概要

このドキュメントは、想い出リンクLPの開発で成功したパターンと手順を記録したものです。今後複数のLPを作成する際の参考として使用してください。

## 📁 プロジェクト構成

```
src/lp/
├── index.html          # メインHTMLファイル
├── css/
│   └── main.css        # スタイルシート
├── js/
│   ├── main-complete.js # 完全版JavaScript（本番用）
│   └── main-simple.js  # 簡易版JavaScript（デバッグ用）
└── assets/             # 画像・アイコン等
```

## 🔧 開発環境セットアップ

### 1. Vite設定
```javascript
// vite.config.js
export default {
  root: 'src/lp',
  outDir: '../lp_dist',
  host: '0.0.0.0',
  open: true
}
```

### 2. package.jsonスクリプト
```json
{
  "scripts": {
    "dev": "vite",
    "build:lp": "vite build",
    "preview": "vite preview"
  }
}
```

## 🏗️ HTMLファイルの構成

### 基本構造
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>想い出リンク</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <!-- ヘッダー -->
    <header class="header">
        <!-- ヘッダーコンテンツ -->
    </header>

    <!-- メインコンテンツ -->
    <main>
        <!-- ヒーローセクション -->
        <section class="hero" id="hero">
            <!-- ヒーローコンテンツ -->
        </section>

        <!-- サービスセクション -->
        <section class="service" id="service">
            <!-- サービスコンテンツ -->
        </section>

        <!-- フローセクション -->
        <section class="flow" id="flow">
            <!-- フローコンテンツ -->
        </section>

        <!-- 料金セクション -->
        <section class="price" id="price">
            <!-- 料金コンテンツ -->
        </section>

        <!-- お申し込みフォーム -->
        <section class="order" id="order">
            <div class="container">
                <h2 class="section-title">お申し込み</h2>
                <div class="order-form-container">
                    <form class="order-form" id="orderForm">
                        <div class="form-group">
                            <label for="email" class="form-label">メールアドレス</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                class="form-input" 
                                required 
                                placeholder="your@example.com"
                            >
                            <div class="form-error" id="emailError"></div>
                        </div>
                        
                        <!-- Hidden fields (v1.1仕様: サーバ側でOriginから解決) -->
                        <input type="hidden" name="tenant" value="petmem" disabled>
                        <input type="hidden" name="lpId" value="direct" disabled>
                        <input type="hidden" name="productType" value="acrylic" disabled>
                        
                        <button type="submit" class="btn btn-primary btn-large" id="submitBtn" aria-describedby="submitHelp">
                            <span class="btn-text">申し込みを送信</span>
                            <span class="btn-spinner" id="spinner" style="display: none;" aria-hidden="true">送信中...</span>
                        </button>
                        <div id="submitHelp" class="sr-only">フォーム送信ボタン。メールアドレスを入力後、このボタンを押してください。</div>
                        
                        <div class="form-error" id="generalError" style="display: none;"></div>
                    </form>
                    
                    <!-- 成功メッセージ（フォームの外に配置） -->
                    <div class="form-success" id="successMessage" style="display: none;">
                        <h3>送信完了</h3>
                        <p>メールをお送りしました。受信ボックスをご確認いただき、メール内のリンクから想い出ページの作成を開始してください。</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- フッター -->
    <footer class="footer">
        <!-- フッターコンテンツ -->
    </footer>

    <!-- Scripts -->
    <!-- reCAPTCHA v3 (本番キー) -->
    <script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
    <!-- 環境変数をグローバル変数として設定 -->
    <script>
      // 環境変数をグローバル変数として設定
      window.VITE_CMS_API_BASE = 'http://localhost:5001';
      window.VITE_RECAPTCHA_SITE_KEY = 'YOUR_SITE_KEY';
      window.VITE_TENANT_ID = 'petmem';
      window.VITE_LP_ID = 'direct';
    </script>
    <script src="js/main-complete.js"></script>
</body>
</html>
```

## 🚀 JavaScriptファイルの構成

### 完全版JavaScript (main-complete.js)

```javascript
/**
 * 想い出リンク LP - 完全版JavaScript
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
  RECAPTCHA_SITE_KEY: window.VITE_RECAPTCHA_SITE_KEY || 'YOUR_SITE_KEY',
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
 */
function toggleElement(element, show) {
  if (!element) return;
  element.style.display = show ? 'block' : 'none';
}

/**
 * エラーメッセージを表示
 */
function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.style.display = 'block';
}

/**
 * エラーメッセージをクリア
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
```

## 🧪 モックAPIサーバー

### test-server.js
```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// LP form API (v1.1仕様)
app.post('/api-gate-lp-form', (req, res) => {
  const { email, recaptchaToken } = req.body;
  console.log('Received form data:', { email, recaptchaToken });
  
  // バリデーション
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      ok: false,
      message: '有効なメールアドレスを入力してください'
    });
  }
  
  // 成功レスポンス
  res.json({
    ok: true,
    message: 'メールを送信しました。受信ボックスをご確認ください。',
    data: {
      requestId: `test_${Date.now()}`,
      email: email,
      origin: req.headers.origin || 'unknown',
      testMode: true
    }
  });
});

// 旧仕様のエンドポイント（互換性のため）
app.post('/api/gate/lp-form', (req, res) => {
  console.log('Legacy endpoint called');
  res.json({ ok: true, message: 'Legacy endpoint - use /api-gate-lp-form' });
});

app.post('/petmemory-lp/asia-northeast1/api/api/gate/lp-form', (req, res) => {
  console.log('Legacy endpoint called');
  res.json({ ok: true, message: 'Legacy endpoint - use /api-gate-lp-form' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log('🚀 Test server started!');
  console.log('📡 Server running at http://localhost:5001/');
  console.log('📋 Available endpoints:');
  console.log('  - GET  /health');
  console.log('  - POST /api-gate-lp-form (v1.1仕様)');
  console.log('  - POST /api/gate/lp-form (旧仕様)');
  console.log('  - POST /petmemory-lp/asia-northeast1/api/api/gate/lp-form (旧仕様)');
  console.log('🧪 Test URLs:');
  console.log('  - LP: http://localhost:3000/');
  console.log('  - Test Dashboard: file://' + __dirname + '/test.html');
});
```

## 🎯 開発手順

### 1. 開発環境の起動
```bash
# Viteサーバー起動
npm run dev

# モックAPIサーバー起動（別ターミナル）
node test-server.js
```

### 2. テスト手順
1. **ブラウザで http://localhost:3000/ にアクセス**
2. **F12キーで開発者ツールを開く**
3. **メールアドレスを入力**
4. **送信ボタンをクリック**
5. **コンソールログを確認**

### 3. 期待されるログ
```
🚀 完全版JavaScript読み込み開始
📄 DOMContentLoaded イベント発火
⚙️ 設定読み込み完了: {CMS_API_BASE: "http://localhost:5001", ...}
🔍 DOM要素取得状況: {form: true, emailInput: true, submitBtn: true, ...}
🎧 イベントリスナー設定開始
✅ フォーム送信イベントリスナー設定
🎯 送信ボタンクリックテスト設定
✅ 完全版JavaScript初期化完了
🌐 window load イベント発火

🖱️ 送信ボタンがクリックされました
📝 フォーム送信開始
✅ バリデーション成功: test@example.com

🔄 reCAPTCHA トークン取得開始
🔍 reCAPTCHA トークン取得開始
🔑 reCAPTCHA サイトキー: 6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S
🌐 grecaptcha オブジェクト: object
✅ grecaptcha オブジェクト確認完了
🔧 grecaptcha.ready: function
🔧 grecaptcha.execute: function
✅ grecaptcha 既に準備済み、直接実行
⏳ grecaptcha.execute() 実行中...
✅ reCAPTCHA トークン取得成功: 0cAFcWeA71JUfvYtKP6d...
🔄 reCAPTCHA トークン取得完了: 0cAFcWeA71JUfvYtKP6d...

🌐 API送信開始: {email: "test@example.com", recaptchaToken: "0cAFcWeA71JUfvYtKP6d..."}
🔗 API URL: http://localhost:5001/api-gate-lp-form
📤 送信データ: {email: "test@example.com", recaptchaToken: "0cAFcWeA71JUfvYtKP6d..."}
✅ フォーム送信成功: {ok: true, message: "メールを送信しました。受信ボックスをご確認ください。", ...}
🎯 showSuccess関数が呼び出されました
📝 フォームを非表示にしました
✅ 成功メッセージを表示しました
```

## 🔧 トラブルシューティング

### reCAPTCHAの問題
- **エラー**: `Invalid listener argument`
- **原因**: `grecaptcha.ready()`の重複呼び出し
- **解決**: grecaptchaが既に準備済みかチェックしてから実行

### ネットワークエラー
- **エラー**: `Failed to fetch`
- **原因**: モックAPIサーバーが起動していない
- **解決**: `node test-server.js`を実行

### 成功メッセージが表示されない
- **原因**: 成功メッセージがフォーム内にある
- **解決**: 成功メッセージをフォームの外に配置

### JavaScriptが動作しない
- **原因**: 環境変数の設定ミス
- **解決**: `window.VITE_*`形式でグローバル変数として設定

## 🚀 本番デプロイ

### 1. 本番環境変数の設定
```html
<script>
  window.VITE_CMS_API_BASE = 'https://your-cms-api.com';
  window.VITE_RECAPTCHA_SITE_KEY = 'YOUR_PRODUCTION_SITE_KEY';
  window.VITE_TENANT_ID = 'production_tenant_id';
  window.VITE_LP_ID = 'production_lp_id';
</script>
```

### 2. ビルド
```bash
npm run build:lp
```

### 3. デプロイ
- Firebase Hosting
- Netlify
- Vercel
- その他の静的ホスティングサービス

## 📋 チェックリスト

### 開発時
- [ ] reCAPTCHA本番キーの設定
- [ ] モックAPIサーバーの起動
- [ ] フォーム送信のテスト
- [ ] 成功メッセージの表示確認
- [ ] バリデーションの動作確認
- [ ] エラーハンドリングの確認

### 本番デプロイ時
- [ ] 本番APIエンドポイントの設定
- [ ] reCAPTCHAのOrigin設定確認
- [ ] 本番環境での動作確認
- [ ] エラーハンドリングの確認
- [ ] パフォーマンスの確認

## 🎯 成功のポイント

1. **reCAPTCHAの初期化問題** - `grecaptcha.ready()`の重複呼び出しを避ける
2. **環境変数の設定** - `window.VITE_*`形式でグローバル変数として設定
3. **デバッグログ** - 詳細なログで問題を特定
4. **エラーハンドリング** - 適切なフォールバック処理
5. **CSS優先度** - `!important`でスタイルの確実な適用
6. **成功メッセージの配置** - フォームの外に配置して確実に表示

このパターンで新しいLPを作成すれば、確実に動作するはずです！
