# TODO-CMS-v2.3.md

## CMS開発チーム向け仕様書 v2.3

### 更新日: 2025年1月
### 更新内容: Stripe決済連携・秘密鍵発行・アクリルスタンド制作フロー対応

---

## 📋 概要

LP（Landing Page）からのStripe決済完了後、CMS（Content Management System）で以下の新機能を実装する必要があります：

1. **秘密鍵発行システム**
2. **アクリルスタンド用写真アップロード**
3. **住所取得・管理**
4. **注文管理システムの拡張**

---

## 🔐 1. 秘密鍵発行システム

### 1.1 要件
- Stripe決済完了後、自動的に秘密鍵を生成
- 秘密鍵をメールで顧客に送信
- 秘密鍵でCMSにアクセス可能

### 1.2 実装項目
- [ ] **秘密鍵生成API**
  - ランダムな32文字の秘密鍵生成
  - 顧客IDと紐付け
  - 有効期限設定（30日間）

- [ ] **メール送信機能**
  - 秘密鍵を含むアクセスリンク送信
  - HTMLメールテンプレート
  - アクリルスタンド制作リンクも含む

- [ ] **認証システム**
  - 秘密鍵によるCMSアクセス認証
  - セッション管理
  - アクセスログ記録

### 1.3 API仕様
```typescript
// 秘密鍵生成
POST /api/generate-secret-key
{
  "customerId": "cus_xxx",
  "email": "customer@example.com",
  "orderId": "order_xxx"
}

// 秘密鍵認証
POST /api/authenticate-secret-key
{
  "secretKey": "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

---

## 📸 2. アクリルスタンド用写真アップロード

### 2.1 要件
- 顧客がアクリルスタンド用の写真をアップロード
- 写真の品質チェック・最適化
- 制作チーム向けの写真管理

### 2.2 実装項目
- [ ] **写真アップロードAPI**
  - ファイル形式チェック（JPEG, PNG）
  - ファイルサイズ制限（10MB以下）
  - 画像解像度チェック（最低1000x1000px推奨）

- [ ] **写真管理システム**
  - アップロード済み写真の一覧表示
  - 写真のプレビュー機能
  - 写真の編集・トリミング機能

- [ ] **制作チーム向け機能**
  - 写真のダウンロード
  - 制作ステータス管理
  - 写真の品質評価

### 2.3 API仕様
```typescript
// 写真アップロード
POST /api/upload-photo
{
  "orderId": "order_xxx",
  "photo": File,
  "metadata": {
    "size": "6cm|10cm|14cm",
    "description": "写真の説明"
  }
}

// 写真一覧取得
GET /api/photos/:orderId

// 写真ダウンロード
GET /api/photos/:photoId/download
```

---

## 🏠 3. 住所取得・管理

### 3.1 要件
- LPから取得した住所情報の管理
- 配送先住所の検索・編集
- 配送ステータス管理

### 3.2 実装項目
- [ ] **住所管理API**
  - 住所情報の保存・更新
  - 住所の検索機能
  - 住所のバリデーション

- [ ] **配送管理システム**
  - 配送先住所の一覧表示
  - 配送ステータス更新
  - 配送完了通知

- [ ] **顧客管理連携**
  - 顧客情報と住所の紐付け
  - 住所履歴の管理
  - 住所変更の追跡

### 3.3 API仕様
```typescript
// 住所情報取得
GET /api/shipping-address/:orderId

// 住所情報更新
PUT /api/shipping-address/:orderId
{
  "postalCode": "123-4567",
  "prefecture": "東京都",
  "city": "渋谷区",
  "address1": "1-2-3",
  "address2": "テストマンション101",
  "name": "田中太郎",
  "phone": "090-1234-5678"
}

// 配送ステータス更新
PUT /api/shipping-status/:orderId
{
  "status": "shipped|delivered|returned",
  "trackingNumber": "1234567890",
  "shippedAt": "2025-01-XX",
  "deliveredAt": "2025-01-XX"
}
```

---

## 📦 4. 注文管理システムの拡張

### 4.1 要件
- Stripe決済情報との連携
- 注文ステータスの詳細管理
- 制作・配送プロセスの追跡

### 4.2 実装項目
- [ ] **注文データベース拡張**
  - Stripe決済IDの保存
  - 決済ステータスの追跡
  - 注文金額・商品情報の管理

- [ ] **注文ステータス管理**
  - 決済完了 → 写真アップロード待ち
  - 写真アップロード完了 → 制作中
  - 制作完了 → 配送中
  - 配送完了 → 完了

- [ ] **ダッシュボード機能**
  - 注文一覧表示
  - ステータス別フィルタリング
  - 注文詳細表示

### 4.3 データベース設計
```sql
-- 注文テーブル拡張
ALTER TABLE orders ADD COLUMN stripe_payment_intent_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN stripe_session_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN order_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN secret_key VARCHAR(255);
ALTER TABLE orders ADD COLUMN secret_key_expires_at TIMESTAMP;

-- 写真テーブル
CREATE TABLE photos (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'uploaded',
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 配送テーブル
CREATE TABLE shipping (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  tracking_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## 🔄 5. 統合フロー

### 5.1 決済完了後のフロー
1. **Stripe Webhook受信**
   - 決済完了イベントをキャッチ
   - 注文ステータスを「決済完了」に更新

2. **秘密鍵生成・メール送信**
   - 秘密鍵を生成
   - 顧客にメール送信（CMSアクセスリンク + 写真アップロードリンク）

3. **顧客のCMSアクセス**
   - 秘密鍵でCMSにログイン
   - 写真アップロード
   - 住所確認・編集

4. **制作・配送プロセス**
   - 写真アップロード完了 → 制作開始
   - 制作完了 → 配送開始
   - 配送完了 → 完了通知

### 5.2 実装優先順位
1. **高優先度**
   - 秘密鍵発行システム
   - 写真アップロードAPI
   - 注文ステータス管理

2. **中優先度**
   - 住所管理API
   - 配送ステータス管理
   - ダッシュボード機能

3. **低優先度**
   - 写真編集機能
   - 詳細なログ機能
   - レポート機能

---

## 📝 6. 技術要件

### 6.1 使用技術
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: Firestore
- **認証**: Firebase Auth + カスタム秘密鍵認証
- **ファイルストレージ**: Firebase Storage
- **メール送信**: Nodemailer + Gmail SMTP

### 6.2 セキュリティ要件
- 秘密鍵の暗号化保存
- ファイルアップロードのセキュリティチェック
- API レート制限
- CORS設定

### 6.3 パフォーマンス要件
- 写真アップロード: 10MB以下、5分以内
- API応答時間: 500ms以下
- 同時接続数: 100ユーザー

---

## 🎯 7. 完了条件

### 7.1 機能テスト
- [ ] Stripe決済完了後の秘密鍵発行
- [ ] 秘密鍵によるCMSアクセス
- [ ] 写真アップロード機能
- [ ] 住所管理機能
- [ ] 注文ステータス管理

### 7.2 統合テスト
- [ ] LP → Stripe → CMS の完全フロー
- [ ] メール送信機能
- [ ] エラーハンドリング
- [ ] セキュリティテスト

---

## 📞 8. 連絡先・サポート

### 8.1 開発チーム
- **プロジェクトマネージャー**: [名前]
- **バックエンド開発**: [名前]
- **フロントエンド開発**: [名前]

### 8.2 質問・相談
- 技術的な質問: [Slackチャンネル]
- 仕様の確認: [メールアドレス]
- 緊急連絡: [電話番号]

---

**この仕様書は随時更新されます。最新版を確認してください。**
