/**
 * 設定とユーティリティ関数
 */

import { EnvironmentConfig, TenantConfig } from "../types";

// 環境変数の取得
export function getEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET || "",
    APP_CLAIM_CONTINUE_URL: process.env.APP_CLAIM_CONTINUE_URL || "",
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || "",
    FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SHEETS_SERVICE_ACCOUNT: process.env.SHEETS_SERVICE_ACCOUNT,
    // Gmail SMTP設定
    GMAIL_USER: process.env.GMAIL_USER || "",
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",
  };

  return config;
}

// テナント設定（ハードコード、将来的にはFirestoreから取得）
export const TENANT_CONFIG: TenantConfig = {
  petmem: {
    allowedLpIds: ["direct", "partner1", "partner2"],
    maxClaimRequestsPerHour: 10,
    enabledProductTypes: ["acrylic", "digital", "premium"],
  },
  // 他のテナントも追加可能
};

// 許可されたテナント・lpIdの組み合わせをチェック
export function isValidTenantLpId(tenant: string, lpId: string): boolean {
  const tenantConfig = TENANT_CONFIG[tenant];
  if (!tenantConfig) {
    return false;
  }
  return tenantConfig.allowedLpIds.includes(lpId);
}

// 許可されたプロダクトタイプをチェック
export function isValidProductType(tenant: string, productType: string): boolean {
  const tenantConfig = TENANT_CONFIG[tenant];
  if (!tenantConfig) {
    return false;
  }
  return tenantConfig.enabledProductTypes.includes(productType);
}

// CORS許可オリジンの取得
export function getAllowedOrigins(): string[] {
  const config = getEnvironmentConfig();
  if (!config.CORS_ALLOWED_ORIGINS) {
    return ["http://localhost:3000"]; // 開発環境用デフォルト
  }
  return config.CORS_ALLOWED_ORIGINS.split(",").map(origin => origin.trim());
}

// reCAPTCHA の最小スコア
export const RECAPTCHA_MIN_SCORE = 0.5;

// レート制限の設定
export const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 60 * 1000, // 1時間
  maxRequestsPerEmail: 3, // 同一メールアドレスあたりの最大リクエスト数
  maxRequestsPerIP: 20, // 同一IPあたりの最大リクエスト数
};

// メールリンクの有効期限（秒）
export const EMAIL_LINK_EXPIRY_SECONDS = 72 * 60 * 60; // 72時間
