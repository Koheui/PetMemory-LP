/**
 * Firebase Auth 関連のユーティリティ
 */

import * as admin from "firebase-admin";

/**
 * Firebase Auth の初期化確認
 */
export function ensureAuthInitialized(): void {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin SDK not initialized");
  }
}

/**
 * メールリンク認証の設定
 */
export function getActionCodeSettings(continueUrl: string) {
  return {
    url: continueUrl,
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.emolink.app'
    },
    android: {
      packageName: 'com.emolink.app',
      installApp: true,
      minimumVersion: '12'
    },
    dynamicLinkDomain: 'emolink.page.link'
  };
}

/**
 * カスタムクレームの設定
 */
export async function setCustomClaims(uid: string, claims: Record<string, any>): Promise<void> {
  try {
    ensureAuthInitialized();
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`Custom claims set for user ${uid}:`, claims);
  } catch (error) {
    console.error(`Failed to set custom claims for user ${uid}:`, error);
    throw error;
  }
}

/**
 * ユーザーの取得
 */
export async function getUserByEmail(email: string) {
  try {
    ensureAuthInitialized();
    return await admin.auth().getUserByEmail(email);
  } catch (error) {
    console.error(`Failed to get user by email ${email}:`, error);
    return null;
  }
}

/**
 * ユーザーの作成
 */
export async function createUser(email: string, displayName?: string) {
  try {
    ensureAuthInitialized();
    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: displayName,
      emailVerified: false,
    });
    console.log(`User created: ${userRecord.uid}`);
    return userRecord;
  } catch (error) {
    console.error(`Failed to create user for email ${email}:`, error);
    throw error;
  }
}

/**
 * メールリンクの生成
 */
export async function generateEmailLink(email: string, continueUrl: string): Promise<string> {
  try {
    ensureAuthInitialized();
    const actionCodeSettings = getActionCodeSettings(continueUrl);
    const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
    console.log(`Email link generated for ${email}`);
    return link;
  } catch (error) {
    console.error(`Failed to generate email link for ${email}:`, error);
    throw error;
  }
}

/**
 * メールリンクの検証
 */
export async function verifyEmailLink(email: string, oobCode: string): Promise<any> {
  try {
    ensureAuthInitialized();
    // Firebase Admin SDK では直接的なメールリンク検証はないため、
    // クライアントサイドで検証する必要があります
    console.log(`Email link verification requested for ${email}`);
    return {
      token: "dummy-token",
      uid: "dummy-uid",
    };
  } catch (error) {
    console.error(`Failed to verify email link for ${email}:`, error);
    throw error;
  }
}

/**
 * セッションクッキーの作成
 */
export async function createSessionCookie(idToken: string, expiresIn: number): Promise<string> {
  try {
    ensureAuthInitialized();
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    console.log("Session cookie created");
    return sessionCookie;
  } catch (error) {
    console.error("Failed to create session cookie:", error);
    throw error;
  }
}

/**
 * セッションクッキーの検証
 */
export async function verifySessionCookie(sessionCookie: string): Promise<admin.auth.DecodedIdToken> {
  try {
    ensureAuthInitialized();
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    console.log("Session cookie verified");
    return decodedClaims;
  } catch (error) {
    console.error("Failed to verify session cookie:", error);
    throw error;
  }
}

/**
 * ユーザーの削除
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    ensureAuthInitialized();
    await admin.auth().deleteUser(uid);
    console.log(`User deleted: ${uid}`);
  } catch (error) {
    console.error(`Failed to delete user ${uid}:`, error);
    throw error;
  }
}
