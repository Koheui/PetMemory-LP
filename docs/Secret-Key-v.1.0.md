emolink secret key 仕様書

# 秘密鍵認証システム仕様書 v1.0


## 概要


想い出リンクCMSの秘密鍵認証システムの仕様書です。LPチームはこの仕様に基づいて秘密鍵生成・管理機能を実装してください。


## 1. 秘密鍵仕様


### 1.1 基本仕様
- **形式**: 16桁の英数字文字列
- **文字セット**: `A-Z`, `0-9`（大文字のみ）
- **例**: `ABCD1234EFGH5678`


### 1.2 管理者用秘密鍵（開発用）
- **秘密鍵**: `emolinkemolinkemo`
- **用途**: 開発・テスト用の管理者認証
- **有効期限**: 無期限
- **使用制限**: 無制限（再使用可能）


### 1.3 通常の秘密鍵
- **生成方法**: LP側で決済完了後に自動生成
- **有効期限**: 30日間
- **使用制限**: 1回のみ（使用後は無効化）


## 2. Firestore スキーマ


### 2.1 secretKeys コレクション（更新版）


```javascript
{
 // ドキュメントID = 秘密鍵
 secretKey: string,           // 秘密鍵（16桁）
 email: string,              // ユーザーのメールアドレス
 tenant: string,             // テナントID
 productType: string,        // プロダクトタイプ
 status: 'active' | 'used' | 'expired',  // ステータス
 createdAt: timestamp,       // 作成日時
 expiresAt: timestamp,       // 有効期限
 usedAt?: timestamp,         // 使用日時（使用後）
 usedBy?: string,            // 使用者メール（使用後）
 paymentIntentId?: string,   // Stripe決済ID
 lpId?: string,              // LP識別子
 // 既存ラベル情報
 tenantId?: string,          // テナントID（既存システム）
 productType?: string        // プロダクトタイプ（既存システム）
}
```


### 2.2 ステータス定義
- **active**: 有効（未使用）
- **used**: 使用済み
- **expired**: 期限切れ


## 3. 秘密鍵生成仕様


### 3.1 生成関数（LP側で実装）


```javascript
function generateSecretKey(): string {
 const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
 let result = '';
 for (let i = 0; i < 16; i++) {
   result += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 return result;
}
```


### 3.2 検証関数


```javascript
function validateSecretKeyFormat(secretKey: string): boolean {
 const regex = /^[A-Z0-9]{16}$/;
 return regex.test(secretKey);
}
```


## 4. 決済完了後の処理フロー


### 4.1 既存ラベル生成機能との統合


現在のシステムでは以下のラベルが既に生成されています：
- **tenant ID**: テナント識別子
- **LP ID**: ランディングページ識別子
- **product type**: プロダクトタイプ（acrylic, digital, premium, standard）


これらの情報を秘密鍵生成時に利用します。


### 4.2 Stripe Webhook処理（更新版）


```javascript
// Firebase Functions
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
 const sig = req.headers['stripe-signature'];
 const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  if (event.type === 'payment_intent.succeeded') {
   const paymentIntent = event.data.object;
  
   // 既存のラベル生成機能から取得
   const tenantId = paymentIntent.metadata.tenantId || paymentIntent.metadata.tenant;
   const lpId = paymentIntent.metadata.lpId;
   const productType = paymentIntent.metadata.productType;
  
   // 1. 秘密鍵生成
   const secretKey = generateSecretKey();
  
   // 2. Firestoreに保存（既存ラベル情報を含む）
   await db.collection('secretKeys').doc(secretKey).set({
     secretKey: secretKey,
     email: paymentIntent.metadata.email,
     tenant: tenantId,
     productType: productType,
     lpId: lpId,
     status: 'active',
     createdAt: new Date(),
     expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日
     paymentIntentId: paymentIntent.id,
     // 既存ラベル情報
     tenantId: tenantId,
     lpId: lpId,
     productType: productType
   });
  
   // 3. ユーザーに秘密鍵を送信
   await sendSecretKeyEmail(paymentIntent.metadata.email, secretKey, {
     tenantId,
     lpId,
     productType
   });
 }
  res.json({received: true});
});
```


### 4.3 メール送信仕様（更新版）


```javascript
async function sendSecretKeyEmail(email: string, secretKey: string, labels: {
 tenantId: string;
 lpId: string;
 productType: string;
}) {
 const productTypeNames = {
   'acrylic': 'NFCタグ付きアクリルスタンド',
   'digital': 'デジタル想い出ページ',
   'premium': 'プレミアム想い出サービス',
   'standard': 'スタンダード想い出サービス'
 };
  const mailOptions = {
   from: 'noreply@emolink.net',
   to: email,
   subject: '想い出リンク - 秘密鍵のお知らせ',
   html: `
     <h2>想い出リンク - 秘密鍵</h2>
     <p>決済が完了しました。以下の秘密鍵でCMSにログインしてください。</p>
    
     <div style="background: #f5f5f5; padding: 20px; text-align: center; font-family: monospace; font-size: 18px; letter-spacing: 2px;">
       <strong>${secretKey}</strong>
     </div>
    
     <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #0066cc;">
       <h3>注文詳細</h3>
       <p><strong>プロダクト:</strong> ${productTypeNames[labels.productType] || labels.productType}</p>
       <p><strong>テナント:</strong> ${labels.tenantId}</p>
       <p><strong>LP:</strong> ${labels.lpId}</p>
     </div>
    
     <p><a href="https://emolink.net" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">CMSにアクセス</a></p>
     <p>※この秘密鍵は30日間有効です。一度使用すると無効になります。</p>
   `
 };
  await transporter.sendMail(mailOptions);
}
```


## 5. CMS認証フロー


### 5.1 認証処理


```javascript
async function authenticateWithSecretKey(secretKey: string) {
 // 1. 管理者用秘密鍵チェック
 if (secretKey === 'emolinkemolinkemo') {
   return createAdminSession();
 }
  // 2. Firestoreから秘密鍵情報取得
 const secretKeyDoc = await getDoc(doc(db, 'secretKeys', secretKey));
  if (!secretKeyDoc.exists()) {
   return { success: false, error: '無効な秘密鍵です' };
 }
  const secretKeyData = secretKeyDoc.data();
  // 3. ステータスチェック
 if (secretKeyData.status !== 'active') {
   return { success: false, error: 'この秘密鍵は使用済みです' };
 }
  // 4. 有効期限チェック
 if (new Date() > secretKeyData.expiresAt.toDate()) {
   return { success: false, error: 'この秘密鍵は期限切れです' };
 }
  // 5. 認証成功 - セッション作成
 const userData = {
   uid: `secret-${Date.now()}`,
   email: secretKeyData.email,
   displayName: secretKeyData.email.split('@')[0],
   tenant: secretKeyData.tenant,
   createdAt: new Date(),
   updatedAt: new Date(),
 };
  // 6. 秘密鍵を無効化
 await updateDoc(doc(db, 'secretKeys', secretKey), {
   status: 'used',
   usedAt: new Date(),
   usedBy: userData.email
 });
  return { success: true, user: userData };
}
```


## 6. エラーハンドリング


### 6.1 エラーメッセージ


| エラー | メッセージ | 原因 |
|--------|------------|------|
| 無効な秘密鍵 | "無効な秘密鍵です" | 存在しない秘密鍵 |
| 使用済み | "この秘密鍵は使用済みです" | 既に使用された秘密鍵 |
| 期限切れ | "この秘密鍵は期限切れです" | 30日経過後の秘密鍵 |
| 認証エラー | "認証中にエラーが発生しました" | システムエラー |


### 6.2 ログ出力


```javascript
console.log('=== Secret Key Authentication ===');
console.log('Secret Key:', secretKey);
console.log('Status:', secretKeyData.status);
console.log('Expires At:', secretKeyData.expiresAt);
console.log('=== End Authentication ===');
```


## 7. セキュリティ考慮事項


### 7.1 秘密鍵の安全性
- 16桁の英数字で十分な強度を確保
- 使用後は即座に無効化
- 30日の有効期限でリスクを最小化


### 7.2 アクセス制御
- テナント分離によるデータアクセス制御
- 秘密鍵とテナントの紐付け
- 使用履歴の記録


### 7.3 監査ログ
- 秘密鍵の生成・使用・無効化の記録
- 決済IDとの紐付け
- アクセス元の記録


## 8. テスト仕様


### 8.1 管理者用秘密鍵テスト
```
秘密鍵: emolinkemolinkemo
期待結果: 管理者として認証成功
```


### 8.2 通常秘密鍵テスト
```
秘密鍵: ABCD1234EFGH5678（Firestoreに存在）
期待結果: 通常ユーザーとして認証成功
```


### 8.3 エラーケーステスト
```
無効な秘密鍵: "INVALID123456789"
期待結果: "無効な秘密鍵です"エラー
```


## 9. 実装チェックリスト


### LP側実装項目
- [ ] Stripe決済統合
- [ ] Webhook処理実装
- [ ] 秘密鍵生成機能
- [ ] Firestore保存処理
- [ ] メール送信機能
- [ ] エラーハンドリング


### CMS側実装項目（完了済み）
- [x] 秘密鍵認証コンテキスト
- [x] 認証フォーム
- [x] セッション管理
- [x] ダッシュボード統合
- [x] ログアウト機能


## 10. 連絡先・サポート


- **技術的な質問**: 開発チーム
- **仕様の変更**: プロジェクトマネージャー
- **緊急時**: システム管理者


## 11. 既存システムとの統合


### 11.1 既存ラベル生成機能


現在のシステムでは以下のラベルが既に生成・管理されています：


#### **tenant ID**
- **用途**: テナント識別
- **例**: `futurestudio`, `petmem`, `client-a`
- **生成タイミング**: LP設定時


#### **LP ID**
- **用途**: ランディングページ識別
- **例**: `emolink.cloud`, `main`, `partner`
- **生成タイミング**: LP作成時


#### **product type**
- **用途**: プロダクトタイプ識別
- **値**: `acrylic`, `digital`, `premium`, `standard`
- **生成タイミング**: 決済時


### 11.2 秘密鍵システムとの連携


秘密鍵生成時には、これらの既存ラベル情報を利用します：


1. **決済完了時**: 既存ラベル情報を取得
2. **秘密鍵生成**: ラベル情報と紐付け
3. **Firestore保存**: ラベル情報を含めて保存
4. **メール送信**: ラベル情報を表示


### 11.3 データフロー


```
決済完了 → 既存ラベル取得 → 秘密鍵生成 → Firestore保存 → メール送信
```


---


**バージョン**: 1.0 
**作成日**: 2025年9月 
**最終更新**: 2025年9月



