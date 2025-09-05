/**
 * 秘密鍵生成・検証ユーティリティ
 * Secret Key v1.0仕様に基づく実装
 */

/**
 * 16桁の英数字秘密鍵を生成
 * @returns {string} 16桁の英数字文字列（A-Z, 0-9）
 */
export function generateSecretKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * 秘密鍵の形式を検証
 * @param {string} secretKey - 検証する秘密鍵
 * @returns {boolean} 有効な形式かどうか
 */
export function validateSecretKeyFormat(secretKey: string): boolean {
  const regex = /^[A-Z0-9]{16}$/;
  return regex.test(secretKey);
}

/**
 * 管理者用秘密鍵かどうかをチェック
 * @param {string} secretKey - チェックする秘密鍵
 * @returns {boolean} 管理者用秘密鍵かどうか
 */
export function isAdminSecretKey(secretKey: string): boolean {
  return secretKey === 'emolinkemolinkemo';
}

/**
 * 秘密鍵の有効期限をチェック
 * @param {Date} expiresAt - 有効期限
 * @returns {boolean} 有効期限内かどうか
 */
export function isSecretKeyExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * 秘密鍵のステータスをチェック
 * @param {string} status - ステータス
 * @returns {boolean} アクティブかどうか
 */
export function isSecretKeyActive(status: string): boolean {
  return status === 'active';
}

/**
 * 秘密鍵の使用可否を総合的にチェック
 * @param {Object} secretKeyData - 秘密鍵データ
 * @returns {Object} チェック結果
 */
export function validateSecretKey(secretKeyData: {
  status: string;
  expiresAt: Date;
}): {
  isValid: boolean;
  error?: string;
} {
  // ステータスチェック
  if (!isSecretKeyActive(secretKeyData.status)) {
    return {
      isValid: false,
      error: 'この秘密鍵は使用済みです'
    };
  }
  
  // 有効期限チェック
  if (isSecretKeyExpired(secretKeyData.expiresAt)) {
    return {
      isValid: false,
      error: 'この秘密鍵は期限切れです'
    };
  }
  
  return { isValid: true };
}

/**
 * 秘密鍵を無効化
 * @param {string} secretKey - 無効化する秘密鍵
 * @param {string} usedBy - 使用者のメールアドレス
 * @returns {Promise<void>}
 */
export async function invalidateSecretKey(secretKey: string, usedBy: string): Promise<void> {
  const { db } = await import('./firebase');
  
  await db.collection('secretKeys').doc(secretKey).update({
    status: 'used',
    usedAt: new Date(),
    usedBy: usedBy
  });
  
  console.log('🔒 秘密鍵無効化完了:', {
    secretKey: secretKey.substring(0, 8) + '...',
    usedBy: usedBy
  });
}

/**
 * 秘密鍵の使用履歴を記録
 * @param {string} secretKey - 秘密鍵
 * @param {string} action - アクション（'generated', 'used', 'expired'）
 * @param {Object} metadata - 追加メタデータ
 * @returns {Promise<void>}
 */
export async function logSecretKeyUsage(
  secretKey: string, 
  action: string, 
  metadata: Record<string, any> = {}
): Promise<void> {
  const { db } = await import('./firebase');
  
  await db.collection('secretKeyLogs').add({
    secretKey: secretKey.substring(0, 8) + '...', // セキュリティのため一部のみ記録
    action: action,
    metadata: metadata,
    timestamp: new Date(),
    ip: metadata.ip || 'unknown'
  });
  
  console.log('📝 秘密鍵使用履歴記録:', {
    secretKey: secretKey.substring(0, 8) + '...',
    action: action
  });
}
