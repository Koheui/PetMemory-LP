# 自社LP 仕様書 v1.1  
更新日: 2025-08-31

## 🎯 目的
- 自社サービス（例：ペットの思い出クラウド）のLP（ランディングページ）。  
- 申込フォーム送信 → CMSプロジェクトの Functions に連携。  
- LPは **Firebase Hosting の静的サイト** として構築。  
- **環境変数を入力するだけでCMSプロジェクトに接続可能**。  
- BtoBで相手先デザイナーが構築しても、**CMSを不正操作できない仕組み**を持つ。

---

## 🖥️ 技術構成
- Firebase Hosting（LP専用プロジェクト）
- フロントはHTML+JS（Firebase SDK不要）
- Functions呼び出し先は **CMSプロジェクトのAPIエンドポイント**
- reCAPTCHA v3 + CORS + HTTPS

---

## 📄 ページ構成
1. メニュー（固定ナビゲーション）
2. ヒーローセクション（背景固定／CTAボタン）
3. サービス紹介（3カラム）
4. オーダーフロー（Step表示）
5. プライスセクション（料金表）
6. 申込フォーム（メール必須／reCAPTCHA付）
7. フッター（会社情報・規約・ポリシー）

---

## 🔧 接続の仕組み

### 環境変数（LP側）
```env
# CMS Functions のエンドポイント
VITE_CMS_API_BASE=https://<region>-<cms-project-id>.cloudfunctions.net

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=xxxxxxxxxxxxxxx

# LP固有の識別子（情報表示用）
VITE_TENANT_ID=petmem
VITE_LP_ID=direct
👉 これらを設定するだけで、LPはCMSに接続可能。
👉 CMS側での受け取りは Originベースで検証するため、クライアントから送られた tenantId や lpId は無視される。

フロント実装（フォーム送信）
html
コードをコピーする
<form id="apply">
  <input type="email" name="email" required />
  <button type="submit">申し込む</button>
</form>

<script>
async function submitForm(event) {
  event.preventDefault();
  const email = document.querySelector('[name=email]').value;

  const token = await grecaptcha.execute(
    import.meta.env.VITE_RECAPTCHA_SITE_KEY,
    {action:'lp_form'}
  );

  const res = await fetch(`${import.meta.env.VITE_CMS_API_BASE}/api-gate-lp-form`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      email,
      recaptchaToken: token
      // tenant/lpIdは送信するが、サーバ側では必ずOriginから再解決
    })
  });

  const json = await res.json();
  alert(json.message);
}
document.querySelector('#apply').addEventListener('submit', submitForm);
</script>
🔒 セキュリティ設計（BtoB対策）
Origin検証必須

CMS Functions側で req.get('Origin') をチェックし、許可済みドメインリストに存在しなければ拒否。

テナントIDはサーバ側で Origin→tenantConfig によって解決。

クライアント値は無視

tenantId や productType はクライアント値を信用せず、サーバ側で強制上書き。

厳格CORS

Access-Control-Allow-Origin = 許可ドメイン1つのみ。

ワイルドカード * は禁止。

reCAPTCHA検証 & レート制限

CMS Functionsで recaptchaToken を検証。

同一IP+Origin+Emailでのリクエスト頻度を制限（例：1hに3件まで）。

監査ログ

claimRequests に origin/ip/ua/recaptchaScore を保存。

不審挙動があれば自動で「ブロック」フラグを付与。

ウィジェット方式（代替案）

相手先デザイナーには <script src=...> のみ渡す方式も可能。

中央管理されたフォームUIを埋め込む形にすれば、不正改変リスクをさらに低減。

✅ 受け入れ条件
LP環境変数を設定するだけでCMSと接続できる。

クライアントが不正に tenantId や productType を改ざんしても無視される。

許可していないドメインからのPOSTは403で拒否。

申込メールは必ず届き、CMSに claimRequests が作成される。

🔮 将来拡張
Stripe決済ゲート（同様にOrigin紐付けで保護）

テナントごとの独自フォームテーマ（安全なサーバ管理下）
