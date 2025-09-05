/**
 * Stripe Payment Intent作成API
 * Secret Key v1.0仕様に基づく実装
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getTenantConfig } from '../utils/config';
import { verifyRecaptcha } from '../utils/recaptcha';
import { sanitizeInput } from '../utils/helpers';

// Stripeインスタンス
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdef', {
  apiVersion: '2025-08-27.basil',
});

interface CreatePaymentIntentRequest {
  email: string;
  amount: number;
  currency: string;
  recaptchaToken: string;
  metadata: {
    tenant: string;
    lpId: string;
    productType: string;
  };
}

/**
 * Payment Intent作成のメイン関数
 */
export async function handleCreatePaymentIntent(req: Request, res: Response): Promise<void> {
  try {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // リクエストボディの検証
    const {
      email,
      amount,
      currency,
      recaptchaToken,
      metadata
    } = req.body as CreatePaymentIntentRequest;
    
    // 必須フィールドの検証
    if (!email || !amount || !currency || !recaptchaToken || !metadata) {
      res.status(400).json({
        ok: false,
        message: '必須フィールドが不足しています',
        error: 'MISSING_FIELDS'
      });
      return;
    }
    
    // 入力データのサニタイゼーション
    const sanitizedEmail = sanitizeInput(email).toLowerCase().trim();
    const sanitizedTenant = sanitizeInput(metadata.tenant);
    const sanitizedLpId = sanitizeInput(metadata.lpId);
    const sanitizedProductType = sanitizeInput(metadata.productType);
    
    // テナント設定の検証
    const tenantConfig = getTenantConfig(sanitizedTenant);
    if (!tenantConfig) {
      res.status(400).json({
        ok: false,
        message: '無効なテナントです',
        error: 'INVALID_TENANT'
      });
      return;
    }
    
    // LP IDの検証
    if (!tenantConfig.allowedLpIds.includes(sanitizedLpId)) {
      res.status(400).json({
        ok: false,
        message: '無効なLP IDです',
        error: 'INVALID_LP_ID'
      });
      return;
    }
    
    // プロダクトタイプの検証
    if (!tenantConfig.enabledProductTypes.includes(sanitizedProductType)) {
      res.status(400).json({
        ok: false,
        message: '無効なプロダクトタイプです',
        error: 'INVALID_PRODUCT_TYPE'
      });
      return;
    }
    
    // reCAPTCHA 検証
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      res.status(400).json({
        ok: false,
        message: 'セキュリティ認証に失敗しました',
        error: 'RECAPTCHA_FAILED'
      });
      return;
    }
    
    // Payment Intent作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: {
        email: sanitizedEmail,
        tenant: sanitizedTenant,
        lpId: sanitizedLpId,
        productType: sanitizedProductType,
        source: 'lp-form'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    console.log('✅ Payment Intent作成成功:', {
      id: paymentIntent.id,
      email: sanitizedEmail,
      tenant: sanitizedTenant,
      lpId: sanitizedLpId,
      productType: sanitizedProductType
    });
    
    // 成功レスポンス
    res.status(200).json({
      ok: true,
      message: 'Payment Intent作成成功',
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
    
  } catch (error) {
    console.error('❌ Payment Intent作成エラー:', error);
    
    res.status(500).json({
      ok: false,
      message: 'Payment Intent作成中にエラーが発生しました',
      error: 'INTERNAL_ERROR'
    });
  }
}
