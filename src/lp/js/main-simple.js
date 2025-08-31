/**
 * 想い出リンク LP - 簡易版JavaScript
 * 送信ボタンのクリック問題を解決
 */

console.log('🚀 簡易版JavaScript読み込み開始');

// ページ読み込み完了確認
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded イベント発火');
});

window.addEventListener('load', () => {
  console.log('🌐 window load イベント発火');
});

// DOM要素の取得
const form = document.getElementById('orderForm');
const emailInput = document.getElementById('email');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const generalError = document.getElementById('generalError');

console.log('🔍 DOM要素取得状況:', {
  form: !!form,
  emailInput: !!emailInput,
  submitBtn: !!submitBtn,
  successMessage: !!successMessage,
  generalError: !!generalError
});

// フォーム送信処理
function handleFormSubmit(event) {
  event.preventDefault();
  console.log('📝 フォーム送信開始');
  
  const email = emailInput.value.trim();
  
  if (!email) {
    console.log('❌ メールアドレスが入力されていません');
    alert('メールアドレスを入力してください');
    return;
  }
  
  if (!email.includes('@')) {
    console.log('❌ メールアドレスの形式が正しくありません');
    alert('正しいメールアドレスを入力してください');
    return;
  }
  
  console.log('✅ バリデーション成功:', email);
  
  // 送信ボタンを無効化
  submitBtn.disabled = true;
  submitBtn.textContent = '送信中...';
  
  // 模擬API送信（実際のAPIは後で実装）
  setTimeout(() => {
    console.log('📤 API送信完了（模擬）');
    
    // フォームを非表示
    if (form) {
      form.style.cssText = 'display: none !important;';
      console.log('📝 フォームを非表示にしました');
    }
    
    // 成功メッセージを表示
    if (successMessage) {
      console.log('🔍 成功メッセージ要素の現在の状態:', {
        display: successMessage.style.display,
        opacity: successMessage.style.opacity,
        visibility: successMessage.style.visibility,
        position: successMessage.style.position,
        zIndex: successMessage.style.zIndex
      });
      
      // CSSの優先度を上げて表示
      successMessage.style.cssText = `
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
      console.log('🔍 成功メッセージ要素の変更後の状態:', {
        display: successMessage.style.display,
        opacity: successMessage.style.opacity,
        visibility: successMessage.style.visibility,
        position: successMessage.style.position,
        zIndex: successMessage.style.zIndex
      });
      
      // 成功メッセージを画面の中央にスクロール
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
    } else {
      console.error('❌ 成功メッセージ要素が見つかりません');
    }
    
    console.log('✅ フォーム送信成功');
  }, 1000);
}

// イベントリスナー設定
if (form) {
  console.log('🎧 フォーム送信イベントリスナー設定');
  form.addEventListener('submit', handleFormSubmit);
} else {
  console.error('❌ フォーム要素が見つかりません');
}

// ボタンクリックテスト
if (submitBtn) {
  console.log('🎯 送信ボタンクリックテスト設定');
  
  // 直接クリックイベントも追加
  submitBtn.addEventListener('click', (event) => {
    console.log('🖱️ 送信ボタンがクリックされました');
    // フォーム送信を手動でトリガー
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  });
  
  // ボタンの状態確認
  console.log('🔍 送信ボタンの状態:', {
    disabled: submitBtn.disabled,
    type: submitBtn.type,
    textContent: submitBtn.textContent,
    style: {
      pointerEvents: submitBtn.style.pointerEvents,
      opacity: submitBtn.style.opacity,
      cursor: submitBtn.style.cursor
    }
  });
} else {
  console.error('❌ 送信ボタン要素が見つかりません');
}

console.log('✅ 簡易版JavaScript初期化完了');
