/**
 * Firebase Functions エントリーポイント（テスト用簡略版）
 */

import * as functions from "firebase-functions";

// ヘルスチェック
export const health = functions
  .region("asia-northeast1")
  .https
  .onRequest((req, res) => {
    res.json({
      ok: true,
      message: "PetMemory Functions API is healthy",
      timestamp: new Date().toISOString(),
    });
  });

// LPフォーム用のFunction（テスト用）
export const lpForm = functions
  .region("asia-northeast1")
  .https
  .onRequest((req, res) => {
    // CORS ヘッダーを設定
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    
    if (req.method !== "POST") {
      res.status(405).json({
        ok: false,
        message: "Method not allowed",
      });
      return;
    }
    
    // テスト用の簡単なレスポンス
    res.json({
      ok: true,
      message: "LP form received successfully",
      data: {
        email: req.body.email,
        tenant: req.body.tenant,
        lpId: req.body.lpId,
        productType: req.body.productType,
        timestamp: new Date().toISOString(),
      },
    });
  });

