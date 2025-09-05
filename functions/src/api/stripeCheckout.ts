/**
 * Stripe Checkout Session作成API
 * 写真アップロード後のStripe決済ページ遷移用
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import { cors } from '../utils/cors';

// Stripe設定
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2025-08-27.basil',
});

/**
 * Stripe Checkout Session作成
 */
export const handleCreateCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    // CORS設定
    cors(req, res);

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    const { productInfo, customerInfo, photo } = req.body;

    // バリデーション
    if (!productInfo || !customerInfo) {
      res.status(400).json({ success: false, error: '必要な情報が不足しています' });
      return;
    }

    console.log('🔄 Stripe Checkout Session作成開始');
    console.log('商品情報:', productInfo);
    console.log('顧客情報:', customerInfo);
    console.log('写真情報:', photo);

    // Stripe Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `NFC付きアクリルスタンド ${productInfo.size}`,
              description: '大切な想い出を永遠に残すアクリルスタンド',
              images: photo ? [] : [], // 写真がある場合は後で追加
            },
            unit_amount: productInfo.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${functions.config().app.claim_continue_url}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${functions.config().app.claim_continue_url}/payment.html`,
      customer_email: customerInfo.email,
      metadata: {
        tenant: 'futurestudio',
        lpId: 'emolink.cloud',
        productType: 'acrylic-stand',
        selectedSize: productInfo.size,
        customerPhone: customerInfo.phone,
        shippingName: customerInfo.shippingInfo.name,
        shippingPostalCode: customerInfo.shippingInfo.postalCode,
        shippingPrefecture: customerInfo.shippingInfo.prefecture,
        shippingCity: customerInfo.shippingInfo.city,
        shippingAddress1: customerInfo.shippingInfo.address1,
        shippingAddress2: customerInfo.shippingInfo.address2 || '',
        photoName: photo ? photo.name : '',
        photoSize: photo ? photo.size : 0,
        photoType: photo ? photo.type : '',
      },
      shipping_address_collection: {
        allowed_countries: ['JP'],
      },
      custom_fields: [
        {
          key: 'shipping_instructions',
          label: {
            type: 'custom',
            custom: '配送に関するご要望（任意）',
          },
          type: 'text',
          optional: true,
        },
      ],
    });

    console.log('✅ Stripe Checkout Session作成完了:', session.id);

    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('❌ Stripe Checkout Session作成エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Checkout Sessionの作成に失敗しました',
    });
  }
};
