/**
 * 初期商品データ作成スクリプト
 * Firestoreに商品カタログデータを作成
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Firebase設定
const firebaseConfig = {
  projectId: 'memorylink-cms'
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 初期商品データを作成
 */
async function createInitialProductData() {
  try {
    console.log('🔄 初期商品データ作成開始');
    
    // 商品データ
    const productData = {
      tenant: 'futurestudio',
      lpId: 'emolink.cloud',
      productType: 'acrylic-stand',
      name: 'NFC付きアクリルスタンド',
      description: '美しいアクリルスタンドにNFCタグを内蔵。スマートフォンをかざすだけで専用の想い出ページにアクセスできます。',
      variants: [
        {
          id: 'size-6cm',
          name: '6cm',
          price: 4500,
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'size-10cm',
          name: '10cm',
          price: 6000,
          displayOrder: 2,
          isActive: true
        },
        {
          id: 'size-14cm',
          name: '14cm',
          price: 8000,
          displayOrder: 3,
          isActive: true
        }
      ],
      images: [
        {
          url: '/assets/hero-product-ColMlAg-.png',
          alt: 'アクリルスタンドの使用例',
          displayOrder: 1
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 商品データを保存
    const productRef = doc(collection(db, 'products'));
    await setDoc(productRef, productData);
    console.log('✅ 商品データ作成完了:', productRef.id);
    
    // テナント設定データ
    const tenantConfigData = {
      tenantId: 'futurestudio',
      lpId: 'emolink.cloud',
      productType: 'acrylic-stand',
      displaySettings: {
        currency: 'JPY',
        currencySymbol: '¥',
        priceFormat: '{symbol}{price:,}'
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // テナント設定を保存
    const tenantConfigRef = doc(collection(db, 'tenantConfigs'));
    await setDoc(tenantConfigRef, tenantConfigData);
    console.log('✅ テナント設定作成完了:', tenantConfigRef.id);
    
    console.log('🎉 初期データ作成完了！');
    
  } catch (error) {
    console.error('❌ 初期データ作成エラー:', error);
  }
}

// 実行
createInitialProductData();
