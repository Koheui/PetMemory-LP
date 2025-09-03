/**
 * reCAPTCHA v3 検証
 */

import { RecaptchaResponse } from "../types";
import { getEnvironmentConfig, RECAPTCHA_MIN_SCORE } from "./config";

/**
 * reCAPTCHA トークンを検証
 */
export async function verifyRecaptcha(token: string): Promise<{
  success: boolean;
  score?: number;
  error?: string;
}> {
  try {
    const config = getEnvironmentConfig();
    
    if (!config.RECAPTCHA_SECRET) {
      console.warn("RECAPTCHA_SECRET not configured");
      return { success: true }; // 開発環境では通す
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: config.RECAPTCHA_SECRET,
        response: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json() as RecaptchaResponse;

    if (!result.success) {
      console.warn("reCAPTCHA verification failed:", result["error-codes"]);
      return {
        success: false,
        error: "reCAPTCHA verification failed",
      };
    }

    // スコアチェック（v3の場合）
    if (result.score !== undefined) {
      if (result.score < RECAPTCHA_MIN_SCORE) {
        console.warn(`reCAPTCHA score too low: ${result.score}`);
        return {
          success: false,
          score: result.score,
          error: "Security check failed",
        };
      }
    }

    return {
      success: true,
      score: result.score,
    };

  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: "reCAPTCHA verification failed",
    };
  }
}
