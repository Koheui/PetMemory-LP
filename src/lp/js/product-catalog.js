/**
 * 商品カタログ動的読み込み
 * Firestoreから商品情報を取得してLPに動的表示
 */

// 商品カタログ設定
const PRODUCT_CATALOG_CONFIG = {
  tenant: 'futurestudio',
  lpId: 'emolink.cloud', 
  productType: 'acrylic-stand'
};

/**
 * 商品情報をAPIから取得
 */
async function loadProductCatalog() {
  try {
    console.log('🔄 商品カタログ読み込み開始');
    
    const response = await fetch(`/api/products/${PRODUCT_CATALOG_CONFIG.tenant}/${PRODUCT_CATALOG_CONFIG.lpId}/${PRODUCT_CATALOG_CONFIG.productType}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 商品カタログ読み込み成功:', data.data);
      renderProductVariants(data.data.product.variants, data.data.config);
    } else {
      throw new Error(data.error || '商品情報の取得に失敗しました');
    }
    
  } catch (error) {
    console.error('❌ 商品カタログ読み込みエラー:', error);
    
    // フォールバック: デフォルト商品情報を表示
    showFallbackProductInfo();
  }
}

/**
 * 商品バリエーションを動的レンダリング
 */
function renderProductVariants(variants, config) {
  const priceContainer = document.getElementById('price-grid');
  
  if (!priceContainer) {
    console.error('❌ 価格グリッドコンテナが見つかりません');
    return;
  }
  
  // 既存の価格カードをクリア
  priceContainer.innerHTML = '';
  
  // バリエーションを表示順序でソート
  const sortedVariants = variants
    .filter(variant => variant.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  
  sortedVariants.forEach((variant, index) => {
    const priceCard = createPriceCard(variant, config, index);
    priceContainer.appendChild(priceCard);
  });
  
  console.log(`✅ ${sortedVariants.length}個の商品バリエーションを表示`);
}

/**
 * 価格カードを動的生成
 */
function createPriceCard(variant, config, index) {
  const card = document.createElement('div');
  card.className = 'price-card';
  
  // 中央のカードを推奨として設定
  const isRecommended = index === 1; // 2番目のカードを推奨
  const recommendedClass = isRecommended ? ' recommended' : '';
  
  card.innerHTML = `
    <div class="price-header">
      <h3>${variant.name} サイズ</h3>
      ${isRecommended ? '<span class="recommended-badge">おすすめ</span>' : ''}
    </div>
    <div class="price-value">
      <span class="price-amount">${formatPrice(variant.price, config)}</span>
    </div>
    <button class="btn btn-primary price-btn" 
            data-size="${variant.name}" 
            data-price="${variant.price}">
      サイズを選ぶ
    </button>
  `;
  
  return card;
}

/**
 * 価格フォーマット
 */
function formatPrice(price, config) {
  return config.priceFormat
    .replace('{symbol}', config.currencySymbol)
    .replace('{price}', price);
}

/**
 * フォールバック: デフォルト商品情報を表示
 */
function showFallbackProductInfo() {
  console.log('⚠️ フォールバック商品情報を表示');
  
  const priceContainer = document.getElementById('price-grid');
  if (!priceContainer) return;
  
  // デフォルト商品情報
  const defaultVariants = [
    { name: '6cm', price: 4500, displayOrder: 1 },
    { name: '10cm', price: 6000, displayOrder: 2 },
    { name: '14cm', price: 8000, displayOrder: 3 }
  ];
  
  const defaultConfig = {
    currency: 'JPY',
    currencySymbol: '¥',
    priceFormat: '{symbol}{price:,}'
  };
  
  renderProductVariants(defaultVariants, defaultConfig);
}

/**
 * 商品カタログ初期化
 */
function initializeProductCatalog() {
  // ページ読み込み時に商品情報を取得
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProductCatalog);
  } else {
    loadProductCatalog();
  }
}

// 商品カタログを初期化
initializeProductCatalog();
