/**
 * ヘルパー関数
 */

import * as crypto from "crypto";
import { admin } from "./firebase";
import { AuditLog } from "../types";

/**
 * メールアドレスのハッシュ化（監査ログ用）
 */
export function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

/**
 * ランダムなリクエストIDを生成
 */
export function generateRequestId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * 入力データのサニタイゼーション
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"\'&]/g, "");
}

/**
 * 監査ログの記録
 */
export async function logAuditEvent(
  event: string,
  tenant: string,
  details: Partial<AuditLog> = {}
): Promise<void> {
  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const dateStr = now.toDate().toISOString().split("T")[0].replace(/-/g, "");
    
    const auditData: AuditLog = {
      event,
      tenant,
      ts: now,
      ...details,
    };

    await db
      .collection("auditLogs")
      .doc(dateStr)
      .collection("items")
      .add(auditData);

    console.log("Audit log recorded:", { event, tenant, details });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    // 監査ログの失敗はビジネスロジックを停止させない
  }
}

/**
 * レート制限チェック用のキーを生成
 */
export function getRateLimitKey(email: string, type: "email" | "ip", identifier: string): string {
  const hour = Math.floor(Date.now() / (1000 * 60 * 60));
  return `rate_limit:${type}:${hour}:${type === "email" ? hashEmail(email) : identifier}`;
}

/**
 * エラーレスポンスの生成
 */
export function createErrorResponse(message: string, statusCode = 400): {
  statusCode: number;
  body: string;
} {
  return {
    statusCode,
    body: JSON.stringify({
      ok: false,
      message,
      error: message,
    }),
  };
}

/**
 * 成功レスポンスの生成
 */
export function createSuccessResponse(message: string, data?: any): {
  statusCode: number;
  body: string;
} {
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      message,
      data,
    }),
  };
}

/**
 * JWT トークンの生成（クレーム用）
 */
export function generateClaimToken(payload: {
  requestId: string;
  email: string;
  tenant: string;
  lpId: string;
}): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + (72 * 60 * 60), // 72時間有効
  };

  const headerBase64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadBase64 = Buffer.from(JSON.stringify(jwtPayload)).toString("base64url");
  
  const secret = process.env.JWT_SECRET || "your-secret-key";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerBase64}.${payloadBase64}`)
    .digest("base64url");

  return `${headerBase64}.${payloadBase64}.${signature}`;
}

/**
 * JWT トークンの検証
 */
export function verifyClaimToken(token: string): any {
  try {
    const [headerBase64, payloadBase64, signature] = token.split(".");
    
    const secret = process.env.JWT_SECRET || "your-secret-key";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      throw new Error("Invalid signature");
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
    
    // 有効期限チェック
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    return payload;
  } catch (error) {
    throw new Error(`Invalid token: ${error}`);
  }
}

/**
 * IPアドレスの取得
 */
export function getClientIP(request: any): string {
  return (
    request.headers["x-forwarded-for"] ||
    request.headers["x-real-ip"] ||
    request.connection?.remoteAddress ||
    request.socket?.remoteAddress ||
    "unknown"
  );
}
