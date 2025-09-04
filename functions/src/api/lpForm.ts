/**
 * LP フォーム処理 API
 * POST /api/gate/lp-form
 */

import { Request, Response } from "express";
import { admin } from "../utils/firebase";
import { verifyRecaptcha } from "../utils/recaptcha";
import { sendClaimEmail } from "../utils/email";
import {
  hashEmail,
  generateRequestId,
  validateEmail,
  sanitizeInput,
  logAuditEvent,
  getRateLimitKey,
  createErrorResponse,
  createSuccessResponse,
  getClientIP,
} from "../utils/helpers";
import {
  isValidTenantLpId,
  isValidProductType,
  RATE_LIMIT_CONFIG,
} from "../utils/config";
import { LpFormRequest, ClaimRequest } from "../types";

/**
 * レート制限チェック
 */
async function checkRateLimit(email: string, ip: string): Promise<boolean> {
  try {
    const db = admin.firestore();
    const now = Date.now();
    const hourStart = Math.floor(now / (1000 * 60 * 60)) * (1000 * 60 * 60);

    // メールアドレス別のレート制限チェック
    const emailKey = getRateLimitKey(email, "email", "");
    const emailQuery = await db
      .collection("rateLimits")
      .where("key", "==", emailKey)
      .where("timestamp", ">=", new Date(hourStart))
      .get();

    if (emailQuery.size >= RATE_LIMIT_CONFIG.maxRequestsPerEmail) {
      return false;
    }

    // IP別のレート制限チェック
    const ipKey = getRateLimitKey("", "ip", ip);
    const ipQuery = await db
      .collection("rateLimits")
      .where("key", "==", ipKey)
      .where("timestamp", ">=", new Date(hourStart))
      .get();

    if (ipQuery.size >= RATE_LIMIT_CONFIG.maxRequestsPerIP) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return true; // エラー時は通す
  }
}

/**
 * レート制限記録
 */
async function recordRateLimit(email: string, ip: string): Promise<void> {
  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // メールアドレス別の記録
    const emailKey = getRateLimitKey(email, "email", "");
    await db.collection("rateLimits").add({
      key: emailKey,
      type: "email",
      identifier: hashEmail(email),
      timestamp: now,
    });

    // IP別の記録
    const ipKey = getRateLimitKey("", "ip", ip);
    await db.collection("rateLimits").add({
      key: ipKey,
      type: "ip",
      identifier: ip,
      timestamp: now,
    });
  } catch (error) {
    console.error("Failed to record rate limit:", error);
  }
}

/**
 * 重複リクエストチェック
 */
async function checkDuplicateRequest(
  email: string,
  tenant: string,
  lpId: string
): Promise<boolean> {
  try {
    const db = admin.firestore();
    const oneHourAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 60 * 60 * 1000)
    );

    const existingRequest = await db
      .collection("claimRequests")
      .where("email", "==", email.toLowerCase().trim())
      .where("tenant", "==", tenant)
      .where("lpId", "==", lpId)
      .where("status", "in", ["pending", "sent"])
      .where("createdAt", ">=", oneHourAgo)
      .limit(1)
      .get();

    return !existingRequest.empty;
  } catch (error) {
    console.error("Duplicate check error:", error);
    return false; // エラー時は重複なしとして扱う
  }
}

/**
 * メールリンク送信
 */
async function sendEmailLink(
  email: string,
  requestId: string,
  tenant: string,
  lpId: string
): Promise<void> {
  try {
    // メール送信
    await sendClaimEmail(email, requestId, tenant, lpId);

  } catch (error) {
    console.error("Failed to send email link:", error);
    throw new Error("メール送信に失敗しました");
  }
}

/**
 * LP フォーム処理のメイン関数
 */
export async function handleLpForm(req: Request, res: Response): Promise<void> {
  try {
    // リクエストボディの検証
    const {
      email,
      tenant,
      lpId,
      productType,
      recaptchaToken,
    } = req.body as LpFormRequest;

    // 必須フィールドの検証
    if (!email || !tenant || !lpId || !productType || !recaptchaToken) {
      const response = createErrorResponse("必須フィールドが不足しています");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // 入力データのサニタイゼーション
    const sanitizedEmail = sanitizeInput(email).toLowerCase().trim();
    const sanitizedTenant = sanitizeInput(tenant);
    const sanitizedLpId = sanitizeInput(lpId);
    const sanitizedProductType = sanitizeInput(productType);

    // メールアドレスのバリデーション
    if (!validateEmail(sanitizedEmail)) {
      const response = createErrorResponse("無効なメールアドレスです");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // テナント・lpId の組み合わせ検証
    if (!isValidTenantLpId(sanitizedTenant, sanitizedLpId)) {
      const response = createErrorResponse("無効なテナントまたはLPIDです");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // プロダクトタイプの検証
    if (!isValidProductType(sanitizedTenant, sanitizedProductType)) {
      const response = createErrorResponse("無効なプロダクトタイプです");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // reCAPTCHA 検証
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      await logAuditEvent("lpForm.recaptchaFailed", sanitizedTenant, {
        lpId: sanitizedLpId,
        emailHash: hashEmail(sanitizedEmail),
        error: recaptchaResult.error,
      });
      
      const response = createErrorResponse("セキュリティ認証に失敗しました");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // クライアントIPの取得
    const clientIP = getClientIP(req);

    // レート制限チェック
    const rateLimitOk = await checkRateLimit(sanitizedEmail, clientIP);
    if (!rateLimitOk) {
      await logAuditEvent("lpForm.rateLimitExceeded", sanitizedTenant, {
        lpId: sanitizedLpId,
        emailHash: hashEmail(sanitizedEmail),
        clientIP,
      });
      
      const response = createErrorResponse("リクエストが多すぎます。しばらく時間をおいて再度お試しください", 429);
      res.status(response.statusCode).send(response.body);
      return;
    }

    // 重複リクエストチェック
    const isDuplicate = await checkDuplicateRequest(
      sanitizedEmail,
      sanitizedTenant,
      sanitizedLpId
    );
    if (isDuplicate) {
      await logAuditEvent("lpForm.duplicateRequest", sanitizedTenant, {
        lpId: sanitizedLpId,
        emailHash: hashEmail(sanitizedEmail),
      });
      
      const response = createErrorResponse("既に申し込み済みです。メールをご確認ください");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // リクエストIDの生成
    const requestId = generateRequestId();
    
    // Firestore に claimRequest を保存
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    const claimRequestData: Omit<ClaimRequest, "sentAt" | "claimedAt"> = {
      email: sanitizedEmail,
      tenant: sanitizedTenant,
      lpId: sanitizedLpId,
      productType: sanitizedProductType,
      source: "lp-form",
      status: "pending",
      emailHash: hashEmail(sanitizedEmail),
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("claimRequests").doc(requestId).set(claimRequestData);

    // メールリンク送信
    await sendEmailLink(sanitizedEmail, requestId, sanitizedTenant, sanitizedLpId);

    // ステータスを "sent" に更新
    await db.collection("claimRequests").doc(requestId).update({
      status: "sent",
      sentAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // レート制限記録
    await recordRateLimit(sanitizedEmail, clientIP);

    // 監査ログ記録
    await logAuditEvent("lpForm.sent", sanitizedTenant, {
      lpId: sanitizedLpId,
      emailHash: hashEmail(sanitizedEmail),
      requestId,
      recaptchaScore: recaptchaResult.score,
      clientIP,
    });

    // 成功レスポンス
    const response = createSuccessResponse("メールを送信しました。受信ボックスをご確認ください。", {
      requestId,
    });
    res.status(response.statusCode).send(response.body);

  } catch (error) {
    console.error("LP form processing error:", error);
    
    // エラーログ記録
    try {
      const { tenant = "unknown", lpId = "unknown" } = req.body || {};
      await logAuditEvent("lpForm.error", tenant, {
        lpId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    const response = createErrorResponse("内部エラーが発生しました。しばらく時間をおいて再度お試しください", 500);
    res.status(response.statusCode).send(response.body);
  }
}
