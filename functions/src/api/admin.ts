/**
 * 初期商品データ作成API
 * POST /api/admin/create-initial-data
 */

import { Request, Response } from 'express';
import { db } from '../utils/firebase';

export async function handleCreateInitialData(req: Request, res: Response): Promise<void> {
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
    const productRef = db.collection('products').doc();
    await productRef.set(productData);
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
    const tenantConfigRef = db.collection('tenantConfigs').doc();
    await tenantConfigRef.set(tenantConfigData);
    console.log('✅ テナント設定作成完了:', tenantConfigRef.id);
    
    res.json({
      success: true,
      message: '初期データ作成完了',
      data: {
        productId: productRef.id,
        tenantConfigId: tenantConfigRef.id
      }
    });
    
  } catch (error) {
    console.error('❌ 初期データ作成エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
