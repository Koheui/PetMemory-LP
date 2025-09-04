/**
 * ログイン処理 API
 * POST /api/auth/login
 */

import { Request, Response } from "express";
import { admin } from "../utils/firebase";
import { verifyRecaptcha } from "../utils/recaptcha";
import { generateEmailLink, verifyEmailLink, createSessionCookie } from "../utils/auth";
import {
  hashEmail,
  validateEmail,
  sanitizeInput,
  logAuditEvent,
  createErrorResponse,
  createSuccessResponse,
  getClientIP,
} from "../utils/helpers";
import { getEnvironmentConfig } from "../utils/config";

interface LoginRequest {
  email: string;
  recaptchaToken: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  sessionCookie?: string;
  expiresIn?: number;
}

/**
 * ログイン処理のメイン関数
 */
export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    // リクエストボディの検証
    const { email, recaptchaToken } = req.body as LoginRequest;

    // 必須フィールドの検証
    if (!email || !recaptchaToken) {
      const response = createErrorResponse("メールアドレスとreCAPTCHAトークンが必要です");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // 入力データのサニタイゼーション
    const sanitizedEmail = sanitizeInput(email).toLowerCase().trim();

    // メールアドレスのバリデーション
    if (!validateEmail(sanitizedEmail)) {
      const response = createErrorResponse("無効なメールアドレスです");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // reCAPTCHA 検証
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      await logAuditEvent("login.recaptchaFailed", "system", {
        emailHash: hashEmail(sanitizedEmail),
        error: recaptchaResult.error,
        clientIP: getClientIP(req),
      });
      
      const response = createErrorResponse("セキュリティ認証に失敗しました");
      res.status(response.statusCode).send(response.body);
      return;
    }

    // ユーザーの存在確認
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(sanitizedEmail);
    } catch (error) {
      // ユーザーが存在しない場合は作成
      userRecord = await admin.auth().createUser({
        email: sanitizedEmail,
        emailVerified: false,
      });
      console.log(`New user created: ${userRecord.uid}`);
    }

    // メールリンクの生成
    const config = getEnvironmentConfig();
    const continueUrl = `${config.APP_CLAIM_CONTINUE_URL}?email=${encodeURIComponent(sanitizedEmail)}`;
    
    await generateEmailLink(sanitizedEmail, continueUrl);

    // 監査ログ
    await logAuditEvent("login.emailLinkGenerated", "system", {
      emailHash: hashEmail(sanitizedEmail),
      clientIP: getClientIP(req),
      recaptchaScore: recaptchaResult.score,
    });

    // 成功レスポンス
    const response: LoginResponse = {
      success: true,
      message: "ログインリンクをメールで送信しました",
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Login error:", error);
    
    await logAuditEvent("login.error", "system", {
      error: error instanceof Error ? error.message : String(error),
      clientIP: getClientIP(req),
    });

    const response = createErrorResponse("ログイン処理中にエラーが発生しました");
    res.status(response.statusCode).send(response.body);
  }
}

/**
 * メールリンク認証の処理
 * GET /api/auth/verify
 */
export async function handleVerifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, oobCode } = req.query;

    if (!email || !oobCode) {
      const response = createErrorResponse("メールアドレスと認証コードが必要です");
      res.status(response.statusCode).send(response.body);
      return;
    }

    const sanitizedEmail = sanitizeInput(email as string).toLowerCase().trim();

    // メールリンクの検証
    const decodedToken = await verifyEmailLink(sanitizedEmail, oobCode as string);

    // セッションクッキーの作成（24時間有効）
    const sessionCookie = await createSessionCookie(decodedToken.token, 24 * 60 * 60 * 1000);

    // 監査ログ
    await logAuditEvent("login.emailVerified", "system", {
      emailHash: hashEmail(sanitizedEmail),
      clientIP: getClientIP(req),
    });

    // セッションクッキーを設定
    res.cookie('session', sessionCookie, {
      maxAge: 24 * 60 * 60 * 1000, // 24時間
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // 成功レスポンス
    const response = createSuccessResponse("ログインが完了しました", {
      userId: decodedToken.uid,
      email: sanitizedEmail,
    });

    res.status(200).json(response);

  } catch (error) {
    console.error("Email verification error:", error);
    
    await logAuditEvent("login.verificationFailed", "system", {
      error: error instanceof Error ? error.message : String(error),
      clientIP: getClientIP(req),
    });

    const response = createErrorResponse("メール認証に失敗しました");
    res.status(response.statusCode).send(response.body);
  }
}

/**
 * ログアウト処理
 * POST /api/auth/logout
 */
export async function handleLogout(req: Request, res: Response): Promise<void> {
  try {
    // セッションクッキーを削除
    res.clearCookie('session');

    // 成功レスポンス
    const response = createSuccessResponse("ログアウトが完了しました");
    res.status(200).json(response);

  } catch (error) {
    console.error("Logout error:", error);
    const response = createErrorResponse("ログアウト処理中にエラーが発生しました");
    res.status(response.statusCode).send(response.body);
  }
}
