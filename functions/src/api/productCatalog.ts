/**
 * 商品カタログAPI
 * 商品情報の取得・更新を管理
 */

import { Request, Response } from 'express';
import { db } from '../utils/firebase';
import { getTenantConfig } from '../utils/config';

/**
 * 商品情報取得
 * GET /api/products/{tenant}/{lpId}/{productType}
 */
export async function handleGetProductCatalog(req: Request, res: Response): Promise<void> {
  try {
    const { tenant, lpId, productType } = req.params;
    
    // テナント設定の検証
    const tenantConfig = getTenantConfig(tenant);
    if (!tenantConfig) {
      res.status(400).json({
        success: false,
        error: 'Invalid tenant configuration'
      });
      return;
    }
    
    // 商品情報を取得
    const productRef = db.collection('products')
      .where('tenant', '==', tenant)
      .where('lpId', '==', lpId)
      .where('productType', '==', productType)
      .where('isActive', '==', true)
      .limit(1);
    
    const productSnapshot = await productRef.get();
    
    if (productSnapshot.empty) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }
    
    const productDoc = productSnapshot.docs[0];
    const productData = productDoc.data();
    
    // テナント設定を取得
    const tenantConfigRef = db.collection('tenantConfigs')
      .where('tenantId', '==', tenant)
      .where('lpId', '==', lpId)
      .where('productType', '==', productType)
      .limit(1);
    
    const tenantConfigSnapshot = await tenantConfigRef.get();
    let config = {
      currency: 'JPY',
      currencySymbol: '¥',
      priceFormat: '{symbol}{price:,}'
    };
    
    if (!tenantConfigSnapshot.empty) {
      const tenantConfigData = tenantConfigSnapshot.docs[0].data();
      config = {
        currency: tenantConfigData.displaySettings?.currency || 'JPY',
        currencySymbol: tenantConfigData.displaySettings?.currencySymbol || '¥',
        priceFormat: tenantConfigData.displaySettings?.priceFormat || '{symbol}{price:,}'
      };
    }
    
    res.json({
      success: true,
      data: {
        product: {
          id: productDoc.id,
          ...productData
        },
        config
      }
    });
    
  } catch (error) {
    console.error('商品情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * 商品情報更新
 * POST /api/products/{tenant}/{lpId}/{productType}
 */
export async function handleUpdateProductCatalog(req: Request, res: Response): Promise<void> {
  try {
    const { tenant, lpId, productType } = req.params;
    const updateData = req.body;
    
    // テナント設定の検証
    const tenantConfig = getTenantConfig(tenant);
    if (!tenantConfig) {
      res.status(400).json({
        success: false,
        error: 'Invalid tenant configuration'
      });
      return;
    }
    
    // 既存の商品情報を取得
    const productRef = db.collection('products')
      .where('tenant', '==', tenant)
      .where('lpId', '==', lpId)
      .where('productType', '==', productType)
      .limit(1);
    
    const productSnapshot = await productRef.get();
    
    if (productSnapshot.empty) {
      // 新規作成
      const newProductRef = db.collection('products').doc();
      await newProductRef.set({
        tenant,
        lpId,
        productType,
        ...updateData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.json({
        success: true,
        data: {
          id: newProductRef.id,
          ...updateData
        }
      });
    } else {
      // 更新
      const productDoc = productSnapshot.docs[0];
      await productDoc.ref.update({
        ...updateData,
        updatedAt: new Date()
      });
      
      res.json({
        success: true,
        data: {
          id: productDoc.id,
          ...updateData
        }
      });
    }
    
  } catch (error) {
    console.error('商品情報更新エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
