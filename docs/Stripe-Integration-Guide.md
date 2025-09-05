# 🔗 Stripe連携設定ガイド

## 📋 **設定手順**

### **1. Stripeダッシュボード設定**

#### **1.1 Webhookエンドポイント設定**
1. Stripeダッシュボード → **Developers** → **Webhooks**
2. **Add endpoint** をクリック
3. エンドポイントURL設定：
   ```
   https://memorylink-cms.cloudfunctions.net/api/stripe-webhook
   ```
4. イベント選択：
   - `payment_intent.succeeded` ✅
   - `payment_intent.payment_failed` ✅
5. **Add endpoint** で保存

#### **1.2 Webhook署名シークレット取得**
1. 作成したWebhookエンドポイントをクリック
2. **Signing secret** セクションで **Reveal** をクリック
3. シークレットをコピー（`whsec_...` で始まる）

### **2. 環境変数設定**

#### **2.1 Firebase Functions環境変数**
```bash
# Stripe設定
firebase functions:config:set stripe.secret_key="sk_live_..." stripe.webhook_secret="whsec_..."

# Gmail設定
firebase functions:config:set gmail.user="your-email@gmail.com" gmail.pass="your-app-password"
```

#### **2.2 ローカル開発用（.env）**
```bash
# functions/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
```

### **3. テスト設定**

#### **3.1 テスト用Webhook**
```bash
# Stripe CLIでローカルテスト
stripe listen --forward-to localhost:5001/your-project-id/us-central1/api/stripe-webhook
```

#### **3.2 テストカード**
- **成功**: `4242424242424242`
- **失敗**: `4000000000000002`
- **3Dセキュア**: `4000002500003155`

## 🔄 **決済フロー詳細**

### **1. 顧客の操作**
```
1. LPでサイズ選択（6cm/10cm/14cm）
2. メールアドレス入力
3. カード情報入力
4. 「申し込む」ボタンクリック
```

### **2. システムの処理**
```
1. Payment Intent作成（選択された価格で）
2. Stripe決済処理
3. 決済完了 → StripeがWebhook送信
4. Webhook受信 → 秘密鍵生成
5. Firestoreに保存
6. メール送信（秘密鍵 + CMSリンク）
```

### **3. 顧客への通知**
```
1. LPで「決済完了」メッセージ表示
2. メール受信（秘密鍵 + CMSリンク）
3. メール内のリンクでCMSアクセス
4. 秘密鍵で認証 → 想い出ページ作成開始
```

## 🛡️ **セキュリティ対策**

### **1. Webhook署名検証**
```typescript
// 必ず署名検証を実装
event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
```

### **2. メタデータ検証**
```typescript
// 必要なメタデータの存在確認
if (!email || !tenant || !lpId || !productType) {
  throw new Error('必要なメタデータが不足しています');
}
```

### **3. 重複処理防止**
```typescript
// 同じPayment Intentの重複処理を防止
const existingSecretKey = await db.collection('secretKeys')
  .where('paymentIntentId', '==', paymentIntent.id)
  .get();
```

## 🧪 **テスト方法**

### **1. ローカルテスト**
```bash
# Firebase Emulator起動
firebase emulators:start --only functions

# Stripe CLIでWebhook転送
stripe listen --forward-to localhost:5001/your-project-id/us-central1/api/stripe-webhook
```

### **2. 本番テスト**
```bash
# 本番デプロイ
firebase deploy --only functions

# Webhookエンドポイント設定
# StripeダッシュボードでWebhook URL設定
```

## 📊 **監視・ログ**

### **1. Stripeダッシュボード**
- **Payments**: 決済状況確認
- **Webhooks**: Webhook送信状況
- **Logs**: エラーログ確認

### **2. Firebase Console**
- **Functions**: 実行ログ確認
- **Firestore**: データ保存状況
- **Authentication**: 認証状況

## 🚨 **トラブルシューティング**

### **1. Webhook受信しない**
- エンドポイントURL確認
- 署名シークレット確認
- ファイアウォール設定確認

### **2. 決済は成功するがメール送信されない**
- Gmail設定確認
- 環境変数確認
- Functions実行ログ確認

### **3. 秘密鍵が生成されない**
- Firestore権限確認
- メタデータ確認
- エラーログ確認

## 💡 **ベストプラクティス**

### **1. 冪等性の確保**
- 同じPayment Intentの重複処理を防止
- トランザクション使用

### **2. エラーハンドリング**
- Webhook失敗時の再試行
- エラーログの詳細記録

### **3. 監視・アラート**
- 決済失敗率の監視
- Webhook失敗のアラート

この設定により、Stripe決済完了を自動検知して秘密鍵を生成・送信できます！
