# TODO-CMS-v2.1.md

## 📋 LP側の仕様まとめ

### 🎯 **概要**
このドキュメントは、LP（ランディングページ）側の実装完了を受けて、CMS（コンテンツ管理システム）側の開発に必要な仕様をまとめたものです。

---

## 🏗️ **システム構成**

### **1. アーキテクチャ**
```
LP (emolink-lp.web.app) → Firebase Functions → CMS (emolink.net)
```

### **2. デプロイ状況**
- **LP**: https://emolink-lp.web.app ✅ 完了
- **Functions**: https://asia-northeast1-memorylink-cms.cloudfunctions.net ✅ 完了
- **CMS**: https://emolink.net/claim ⏳ 開発中

---

## 📧 **メール送信システム**

### **1. メール送信フロー**
1. **LPフォーム送信** → **Functions API** → **Firebase DB** → **メール送信**
2. **2つのメールが送信される**:
   - 確認メール（フォーム送信者向け）
   - 想い出ページ作成リンク（フォーム送信者向け）

### **2. メール内容**
- **ブランド**: エモリンククラウド
- **確認メール件名**: "エモリンククラウド - お申し込み確認"
- **リンクメール件名**: "エモリンククラウド - 想い出ページ作成のご案内"

### **3. メールリンクの形式**
```
https://emolink.net/claim?rid={requestId}&tenant={tenant}&lpId={lpId}&k={claimToken}
```

---

## 🔗 **CMS側で必要な実装**

### **1. クレームページ (`/claim`)**
- **URL**: `https://emolink.net/claim`
- **パラメータ**:
  - `rid`: リクエストID
  - `tenant`: テナントID
  - `lpId`: LP ID
  - `k`: JWTトークン（認証用）

### **2. 必要な機能**
1. **JWTトークン検証**: `k` パラメータの検証
2. **リクエスト検証**: `rid` でFirebase DBからリクエスト取得
3. **ステータス更新**: リクエストを "claimed" に更新
4. **想い出ページ作成フォーム**: ユーザーが想い出ページを作成

### **3. データベース連携**
- **Firebase Firestore**: `claimRequests` コレクション
- **ドキュメントID**: `rid`（リクエストID）
- **フィールド**:
  ```typescript
  {
    email: string,
    tenant: string,
    lpId: string,
    productType: string,
    source: "lp-form",
    status: "pending" | "sent" | "claimed" | "expired",
    emailHash: string,
    createdAt: Timestamp,
    updatedAt: Timestamp,
    sentAt?: Timestamp,
    claimedAt?: Timestamp
  }
  ```

---

## 🔧 **技術仕様**

### **1. Functions API**
- **エンドポイント**: `https://asia-northeast1-memorylink-cms.cloudfunctions.net/lpForm`
- **メソッド**: POST
- **Content-Type**: application/json
- **リクエスト形式**:
  ```json
  {
    "email": "user@example.com",
    "tenant": "petmem",
    "lpId": "direct",
    "productType": "acrylic",
    "recaptchaToken": "token"
  }
  ```

### **2. 環境変数**
- **DEFAULT_TENANT**: "petmem"
- **DEFAULT_LP_ID**: "direct"
- **GMAIL_USER**: "emolink.guide@gmail.com"
- **APP_CLAIM_CONTINUE_URL**: "https://emolink.net/claim"

### **3. セキュリティ**
- **reCAPTCHA v3**: フォーム送信時の検証
- **JWTトークン**: メールリンクの認証
- **レート制限**: メールアドレス・IP別の制限
- **重複チェック**: 同一メールアドレスの重複送信防止

---

## 📊 **データフロー**

### **1. フォーム送信時**
```
LP → Functions → Firebase DB (status: "pending") → メール送信 → Firebase DB (status: "sent")
```

### **2. リンククリック時**
```
メールリンク → CMS → JWT検証 → リクエスト取得 → 想い出ページ作成 → Firebase DB (status: "claimed")
```

---

## 🎨 **UI/UX要件**

### **1. クレームページ**
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **ブランド統一**: エモリンククラウドのブランドカラー
- **ユーザビリティ**: 直感的な想い出ページ作成フォーム

### **2. エラーハンドリング**
- **無効なリンク**: 適切なエラーメッセージ表示
- **期限切れ**: 72時間の有効期限管理
- **重複使用**: 一度使用済みのリンクの処理

---

## 🔄 **運用・保守**

### **1. 監視**
- **Functions ログ**: Firebase Console で確認
- **メール送信状況**: Gmail SMTP の配信状況
- **エラー監視**: 自動エラー通知の設定

### **2. 拡張性**
- **新しいテナント**: `functions/src/utils/email.ts` の `getEmailConfig()` に追加
- **新しいLP**: LP側の環境変数で管理
- **新しい商品タイプ**: `functions/src/utils/config.ts` の `TENANT_CONFIG` に追加

---

## 📝 **開発チェックリスト**

### **CMS側で実装が必要な項目**
- [ ] JWTトークン検証機能
- [ ] Firebase Firestore 連携
- [ ] クレームページ (`/claim`) の実装
- [ ] 想い出ページ作成フォーム
- [ ] エラーハンドリング
- [ ] レスポンシブデザイン
- [ ] ブランド統一（エモリンククラウド）

### **テスト項目**
- [ ] メールリンクからの正常な遷移
- [ ] JWTトークンの検証
- [ ] 無効なリンクの処理
- [ ] 期限切れリンクの処理
- [ ] 重複使用の防止
- [ ] 想い出ページ作成の完了

---

## 📞 **連絡先・サポート**

### **技術的な質問**
- LP・Functions側: 現在の開発チーム
- CMS側: CMS開発チーム

### **緊急時対応**
- Functions の障害: Firebase Console でログ確認
- メール送信障害: Gmail SMTP の設定確認
- CMS側の障害: CMS開発チームに連絡

---

## 📅 **スケジュール**

### **完了済み**
- ✅ LP側の実装
- ✅ Functions側の実装
- ✅ メール送信システム
- ✅ Firebase Hosting へのデプロイ

### **進行中**
- ⏳ CMS側の開発
- ⏳ クレームページの実装
- ⏳ 想い出ページ作成フォーム

### **今後の予定**
- 📅 CMS側のテスト
- 📅 統合テスト
- 📅 本番リリース

---

**作成日**: 2025年9月4日  
**バージョン**: v2.1  
**作成者**: LP開発チーム
