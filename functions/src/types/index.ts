/**
 * 型定義
 */

// LP フォーム送信データ
export interface LpFormRequest {
  email: string;
  tenant: string;
  lpId: string;
  productType: string;
  recaptchaToken: string;
}

// Claim Request ドキュメント
export interface ClaimRequest {
  email: string;
  tenant: string;
  lpId: string;
  productType: string;
  source: "lp-form" | "storefront" | "stripe";
  status: "pending" | "sent" | "claimed" | "expired";
  sentAt?: FirebaseFirestore.Timestamp;
  claimedAt?: FirebaseFirestore.Timestamp;
  emailHash: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// API レスポンス
export interface ApiResponse<T = any> {
  ok: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 環境変数の型
export interface EnvironmentConfig {
  RECAPTCHA_SECRET: string;
  APP_CLAIM_CONTINUE_URL: string;
  CORS_ALLOWED_ORIGINS: string;
  FIREBASE_WEB_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SHEETS_SERVICE_ACCOUNT?: string;
  // Gmail SMTP設定
  GMAIL_USER: string;
  GMAIL_APP_PASSWORD: string;
}

// reCAPTCHA レスポンス
export interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  "challenge_ts"?: string;
  hostname?: string;
  "error-codes"?: string[];
}

// テナント設定
export interface TenantConfig {
  [tenantId: string]: {
    allowedLpIds: string[];
    maxClaimRequestsPerHour: number;
    enabledProductTypes: string[];
  };
}

// 監査ログ
export interface AuditLog {
  event: string;
  tenant: string;
  lpId?: string;
  emailHash?: string;
  orderRef?: string;
  pageId?: string;
  operator?: string;
  device?: string;
  ts: FirebaseFirestore.Timestamp;
  details?: Record<string, any>;
  // 追加フィールド
  error?: string;
  clientIP?: string;
  requestId?: string;
  recaptchaScore?: number;
  stack?: string;
}
