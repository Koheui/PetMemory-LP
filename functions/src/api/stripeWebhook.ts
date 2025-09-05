/**
 * Stripe Webhook処理
 * Secret Key v1.0仕様に基づく実装
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { generateSecretKey } from '../utils/secretKey';
import { sendSecretKeyEmail } from '../utils/email';
import { db } from '../utils/firebase';

// Stripeインスタンス
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdef', {
  apiVersion: '2025-08-27.basil',
});

// Webhook署名検証用のエンドポイントシークレット
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

/**
 * Stripe Webhook処理のメイン関数
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const body = req.body;
    
    let event: Stripe.Event;
    
    try {
      // Webhook署名検証
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      console.error('❌ Webhook署名検証エラー:', err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    
    console.log('🔔 Webhook受信:', event.type);
    
    // イベントタイプ別の処理
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.log(`未処理のイベントタイプ: ${event.type}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook処理エラー:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * 決済成功時の処理
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('✅ 決済成功:', paymentIntent.id);
    
    // メタデータから情報を取得
    const email = paymentIntent.metadata.email;
    const tenant = paymentIntent.metadata.tenant;
    const lpId = paymentIntent.metadata.lpId;
    const productType = paymentIntent.metadata.productType;
    
    if (!email || !tenant || !lpId || !productType) {
      throw new Error('必要なメタデータが不足しています');
    }
    
    // 秘密鍵生成
    const secretKey = generateSecretKey();
    
    // 有効期限設定（30日後）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Firestoreに保存
    await db.collection('secretKeys').doc(secretKey).set({
      secretKey: secretKey,
      email: email,
      tenant: tenant,
      productType: productType,
      lpId: lpId,
      status: 'active',
      createdAt: new Date(),
      expiresAt: expiresAt,
      paymentIntentId: paymentIntent.id
    });
    
    console.log('💾 秘密鍵保存完了:', {
      secretKey: secretKey.substring(0, 8) + '...',
      email: email,
      tenant: tenant,
      lpId: lpId,
      productType: productType
    });
    
    // 秘密鍵メール送信
    await sendSecretKeyEmail(email, secretKey, {
      tenantId: tenant,
      lpId: lpId,
      productType: productType
    });
    
    console.log('📧 秘密鍵メール送信完了:', email);
    
  } catch (error) {
    console.error('❌ 決済成功処理エラー:', error);
    throw error;
  }
}

/**
 * 決済失敗時の処理
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('❌ 決済失敗:', paymentIntent.id);
    
    // 失敗ログを記録（必要に応じて）
    await db.collection('paymentFailures').add({
      paymentIntentId: paymentIntent.id,
      email: paymentIntent.metadata.email,
      tenant: paymentIntent.metadata.tenant,
      lpId: paymentIntent.metadata.lpId,
      productType: paymentIntent.metadata.productType,
      failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
      createdAt: new Date()
    });
    
  } catch (error) {
    console.error('❌ 決済失敗処理エラー:', error);
    throw error;
  }
}
