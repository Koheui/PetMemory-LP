想い出リンク｜全体設計図 v4.0（統合仕様・LP/アプリ/運用まで）

目的：LP（BtoC/BtoB）→ 認証（メールリンク）→ CMS編集/公開 → NFC/QR 書込 → 印刷/出荷まで、 プロダクト全体の仕様と運用を 1 枚の設計図に統合。Cursor/Gemini/VSCode など別環境でも迷わない参照元とする。

0. スコープ & ゴール

BtoC 自社直販：ペット追悼用「NFC付きアクリルスタンド＋想い出ページ」

BtoB テナント：赤ちゃん筆/ペット葬 等の提携LP経由で同じCMSを裏側で提供

共通要件：

秘密鍵の事前配布はしない。ゲート通過（LP/Stripe/店舗）→ メールリンクでクレーム。

買い切り、ランニング極小化：静的配信＋強キャッシュ、画像/動画の最適化配信。

誤紐付けゼロ：NFC書込は UI 確認→書込→再読込検証→ログ必須。QR＋短縮URLを全件同梱。

マルチテナント分離：tenant / lpId を全主要データに付与、Rules/Claims/CORSで多層ガード。

1. システム一覧（コア5 + 拡張4）
コア（必須）

自社LP（BtoC）：静的HTML。フォーム→ Functions(/api/gate/lp-form)。

テナントLP群（BtoB）：各社ドメインのLP。Partner Form→ 同API（CORS・reCAPTCHA）。

アプリ（app.example.com）：サインイン/クレーム/編集/公開/管理UI。

公開サイト（mem.example.com）：/p/{pageId} 静的配信（deliver/**）。

バックエンド（Functions/Firestore/Storage）：ゲート受付、メールリンク発行、公開ビルド、監査、Webhook。

拡張（必要に応じて）

専用NFC書込アプリ（Electron + ACR122U）：顧客一覧→1クリック書込→検証→ログ。

QR同梱PDFジェネレータ：qr.png 生成＋A4テンプレ合成（pdfkit）。

Sheets 同期（可視化）：claimRequests / orders をGoogle Sheetsへ定期出力（PII最小）。

画像処理パイプライン（将来）：背景除去→プレビュー承認→制作連携。

2. ドメイン & Hosting

LP：https://lp.example.com（またはテナント各社の独自ドメイン）

アプリ：https://app.example.com（Auth必須 / SPA）

公開：https://mem.example.com（Auth不要 / 静的）

ヘッダ例（firebase.json）

{
  "hosting": [
    { "site": "lp-example-com",  "public": "lp_dist" },
    { "site": "app-example-com", "public": "app_dist", "rewrites": [{"source":"**","destination":"/index.html"}] },
    { "site": "mem-example-com", "public": "mem_dist",
      "headers": [
        { "source": "/p/**",       "headers": [{"key":"Cache-Control","value":"public, max-age=300"}] },
        { "source": "/deliver/**", "headers": [{"key":"Cache-Control","value":"public, max-age=31536000, immutable"}] }
      ]
    }
  ]
}
3. データ & マルチテナント設計
3.1 Firestore コレクション（要約）
users/{uid}
  email, displayName?, createdAt, updatedAt


claimRequests/{requestId}
  email, tenant, lpId, productType, source: "lp-form"|"storefront"|"stripe",
  status: "pending"|"sent"|"claimed"|"expired",
  sentAt?, claimedAt?, emailHash


memories/{memoryId}
  ownerUid, tenant, lpId, title, type, status, publicPageId,
  design{ theme, fontScale, ... }, blocks[...], createdAt, updatedAt


assets/{assetId}
  memoryId, ownerUid, type, storagePath, url, thumbnailUrl?, size, createdAt


publicPages/{pageId}
  tenant, memoryId, title, about?, design{...}, media{...}, ordering,
  publish{ status, version, publishedAt }, access{ mode }, createdAt
publicPages/{pageId}/blocks/{blockId}
  type, order, visibility, ...


orders/{orderId}
  tenant, lpId, orderRef, ownerUid?, memoryId?, publicPageId?, productType,
  fulfillmentMode: "tenantDirect"|"vendorDirect",
  status: lifecycle（下表）, print{ qrPrinted },
  nfc{ written, pageUrl, device, operator, prevUrl, writtenAt },
  shipping{ packed, shippedAt, trackingNo, address? },
  createdAt, updatedAt


auditLogs/{yyyyMMdd}/items/{autoId}
  event, tenant, lpId, emailHash?, orderRef?, pageId?, operator?, device?, ts
3.2 Storage パス（要約）
# 編集・処理中（非公開）
users/{uid}/memories/{memoryId}/uploads/{fileId}
proc/users/{uid}/memories/{memoryId}/{images|thumbs}/...


# 公開（CDN配信）
deliver/publicPages/{pageId}/cover.jpg
.../gallery/{fileId}.jpg
.../video/{fileId}.mp4
.../audio/{fileId}.mp3
.../qr.png
.../manifest.json
3.3 インデックス例

(tenant, status, updatedAt desc)

(tenant, lpId, status, updatedAt desc)

(tenant, updatedAt desc)

3.4 テナント分離ルール（要旨）

すべての主要ドキュメントに tenant（必須）と lpId を保持

Functions 側で ホワイトリスト検証（ALLOWED_TENANTS[tenant].includes(lpId)）

/claim で 4点突合：auth.email === claimRequests.email かつ tenant/lpId 一致 かつ rid 有効

Rules + Custom Claims（role, adminTenant）で二重ガード

4. 認証／クレーム（メールリンク）

**メールリンク（パスワードレス）**を“秘密鍵”として使用。

初回サインイン後は browserLocalPersistence で自動復元。別端末は「リンク再送」導線。

メール違い：/claim で検知→宛先変更フロー（所有確認→再送）。

任意で「パスワード設定」や「Google連携」を追加紐付け可能。

5. 主要フロー
5.1 BtoC 自社LP

LPフォーム送信（email, tenant=petmem, lpId=direct, productType=acrylic, recaptchaToken）

Functions：reCAPTCHA→claimRequests 生成→Authメールリンク送信（72h）

ユーザー：メール→/claim?rid=...&tenant=...&lpId=...

アプリ：signInWithEmailLink→ 4点突合 OK → memories 作成、publicPageId 付与

編集→「公開」→ Functions が deliver/** を生成、publicPages.publish 更新

（任意）決済/住所入力→ orders 作成、フルフィルメントへ

5.2 BtoB テナントLP

Partner Form から 最小情報のみ送信：email, tenant, lpId, productType, orderRef, fulfillmentMode, (vendorDirectなら shipping)

同じ /api/gate/lp-form 系のゲートで受け、以降は BtoC と同一フロー

PII最小化：tenantDirect では住所を扱わない。vendorDirect でも短期保持。

5.3 NFC 書込（本社）

Electron + ACR122U：顧客一覧→「書込」→ 読取→視認確認→書込→再読取検証→ログ

上書き禁止（異URL検知）。管理者のみ「初期化→再書込」二重確認。

ログ：tenant/lpId/orderRef/pageId/operator/device/writtenAt/prevUrl

5.4 QR 同梱（全案件必須）

publicPages 更新で qr.png 自動生成、A4テンプレPDF（任意）

紙に QR + 短縮URL を印刷し必ず同封（NFC不調時の保険）

6. Functions API（I/Oサマリ）
6.1 ゲート／クレーム系

POST /api/gate/lp-form：LP/Partner からの申込を受理 → claimRequests 作成 → Authメールリンク送信

GET /claim（アプリ側実装）：rid 取得→ 4点突合 → memories 発行

POST /api/claim/change-email（任意）：宛先変更→所有確認→再送

6.2 公開ビルド

POST /api/publish-page：認可（owner/admin）→ deliver/** 出力、manifest.json、publicPages.publish.version++

onFinalize（Storage）：アップロード画像のリサイズ/サムネ生成（sharp）

6.3 管理/運用

GET /api/admin/orders/list?tenant=&status=&lpId=&from=&to=：一覧（JOIN整形）

POST /api/admin/print/qr-batch：orderIds[] → A4PDF 生成→ Storage 保存→ print.qrPrinted=true

POST /api/admin/nfc/write-log：書込結果を確定（直接書換不可）

POST /api/admin/ship/{pack|ship}：梱包/出荷（伝票・運送）

POST /api/admin/users/set-claims：superAdmin 専用 昇格API（監査）

6.4 Webhook/Batch

/hooks/stripe：決済成功→ orders.status=paid

Sheets 同期（CRON）：claimRequests/orders をテナント別タブで出力（PIIは emailHash）

原本削除（CRON）：uploads/ を30日後に削除（Web配信用だけ残す）

7. セキュリティ／プライバシー

Rules：

memories/assets：owner または admin のみ

orders/claimRequests：クライアント書込禁止（Functionsのみ）

publicPages：read public、write禁止

Claims：role = superAdmin | tenantAdmin | fulfillmentOperator、adminTenant を付与

CORS：LP/テナントドメインの許可リストで制限

reCAPTCHA：v3 スコア判定、閾値未満は拒否

App Check：Auth/Firestore/Functions/Storage（本番）

PII最小化：住所は vendorDirect の短期保持のみ。ログは emailHash。

監査：全重要イベントを auditLogs に記録（テナント含む）

8. 管理者 & コンソール設定（v3.2反映）

Auth：Emailリンク有効／承認済みドメインに app.example.com

環境変数：RECAPTCHA_SECRET, APP_CLAIM_CONTINUE_URL, CORS_ALLOWED_ORIGINS, （任意）STRIPE_*, SHEETS_*

初回昇格：ワンタイム bootstrapAdmin 関数→superAdmin 付与→無効化

運用昇格：/api/admin/users/set-claims（superAdmin専用・監査付き）

9. NFC書込アプリ（ACR122U / Electron）

構成：Electron(Main) + React(Renderer) + nfc-pcsc

機能：

Firestore/Functionsから顧客一覧→ 行アクション「書込」

読取→視認確認→書込→再読取検証（上書き禁止）

書込ログ：Functions API 経由で確定（orders.nfc, auditLogs）

バーコード：orderRef スキャンで行ジャンプ

QR印刷：qr.png をA4テンプレに配置→PDF→印刷

ビルド：electron-builder（Win/Mac）

10. コスト / パフォーマンス

配信は静的化＋CDN強キャッシュ、Firestore読取極小化

画像/動画は最適解像度のみ配信、原本は30日後削除（オプション：ローカル長期保管）

動画オフロード（任意）：Vimeo等（UI非表示の埋込）※削除は慎重に、原本/ローカル保管推奨

11. CI/CD & バージョン管理

リポジトリ分割（例）：

repo-lp/（静的LP）

repo-app/（アプリ）

repo-functions/（API/Jobs）

repo-nfc-writer/（Electron）

ブランチ命名：feature/nfc-writer, fix/claim-email, chore/release

タグ運用：vX.Y.Z（リリース毎に打つ／ロールバック容易）

デプロイ：firebase deploy --only hosting,functions

12. テスト & KPI
12.1 受け入れテスト

LP：reCAPTCHA→/api/gate/lp-form 正常系／CORS拒否／レート制限

/claim：4点突合（email/tenant/lpId/rid）OK/NG、期限切れ再送

公開：/deliver/** が正しい、Cache-Control が効く

NFC：空タグ→書込→再読取一致、異URL→上書き禁止、100連続耐久

QR：全件 qr.png が存在、PDF一括生成

12.2 KPI

メールリンク開封→サインイン率、claimed 率

approved / paid / shipped ファネル

NFC誤書込ゼロ、サポート問い合わせ率

13. リスク & 対策

テナント混線：4点突合・Claims・CORS・監査の多層防御

NFC不良/端末非対応：QR＋短縮URLを全件同梱

動画コスト増：最適化配信＋外部オフロード＋原本のローカル保管

メール未達：Authテンプレ調整、SPF/DMARC整備、再送導線

人的ミス：UIで視認→書込→即検証、上書き禁止、作業ログ

14. 今後の拡張

季節カード：memories/{id}/seasons/{seasonId}、/s/{seasonId} 公開

画像自動切抜き：Remove.bg or 自前モデル→プレビュー承認→制作

多言語：/p/{pageId}?lang=ja|en

配送追跡自動化：キャリアAPIと連携→delivered 自動更新

付録A：ステータス遷移（Orders）
pending → linkSent → claimed → (paid) → (approved) → printReady → nfcReady → shipped → delivered

印刷とNFCは並行可。行のフラグ：print.qrPrinted / nfc.written / shipping.packed

遷移は Functions 側で許可グラフを定義し、飛び級・逆行を制限

付録B：必要環境変数（一覧）

共通：FIREBASE_WEB_API_KEY, APP_CLAIM_CONTINUE_URL, RECAPTCHA_SECRET, CORS_ALLOWED_ORIGINS

任意：STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SHEETS_SERVICE_ACCOUNT

付録C：実装メモ（/claim 4点突合）

isSignInWithEmailLink でリンク判定→ signInWithEmailLink(email, window.location.href)

URLの rid, tenant, lpId 取得

Firestore claimRequests[rid] を取得

auth.email === doc.email && tenant/lpId 一致 && status in {sent} → OK

memories / publicPages を作成、orders とひも付け、status=claimed

以上。LPを別Cursorで実装しても、この設計図のAPI/ドメイン/パラメータを守れば全体が噛み合います。運用とセキュリティは「多層防御＋監査」を徹底してください。