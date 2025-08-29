/**
 * Firebase Admin SDK 初期化
 */

import * as admin from "firebase-admin";

// Admin SDK の初期化（1回のみ）
if (!admin.apps.length) {
  admin.initializeApp();
}

export { admin };
