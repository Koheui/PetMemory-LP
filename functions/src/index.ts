/**
 * Firebase Functions エントリーポイント
 */

import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { handleLpForm } from "./api/lpForm";
import { handleLogin, handleVerifyEmail, handleLogout } from "./api/auth";

// Express アプリケーションの作成
const app = express();

// CORS 設定
const corsOptions = {
  origin: true, // 一時的にすべてのオリジンを許可
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ヘルスチェック
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "emolink Functions API is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// LP フォームエンドポイント
app.post("/api/gate/lp-form", handleLpForm);

// 認証エンドポイント
app.post("/api/auth/login", handleLogin);
app.get("/api/auth/verify", handleVerifyEmail);
app.post("/api/auth/logout", handleLogout);

// 404 ハンドラー
app.use("*", (req, res) => {
  res.status(404).json({
    ok: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

// エラーハンドラー
app.use((error: any, req: any, res: any, next: any) => {
  console.error("API Error:", error);
  res.status(500).json({
    ok: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : "Unknown error",
  });
});

// Firebase Functions としてエクスポート
export const api = functions
  .region("asia-northeast1")
  .https
  .onRequest(app);

// 個別のエンドポイント（後方互換性のため）
export const health = functions
  .region("asia-northeast1")
  .https
  .onRequest((req, res) => {
    res.json({
      ok: true,
      message: "emolink Functions API is healthy",
      timestamp: new Date().toISOString(),
    });
  });

export const lpForm = functions
  .region("asia-northeast1")
  .https
  .onRequest(async (req, res) => {
    console.log('🔍 lpForm function called');
    console.log('📝 Request method:', req.method);
    console.log('📝 Request body:', req.body);
    
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
    
    try {
      console.log('🚀 Starting email sending process...');
      
      // 直接メール送信処理を実行
      const { email, tenant, lpId, productType } = req.body;
      
      console.log('📧 Email:', email);
      console.log('🏢 Tenant:', tenant);
      console.log('🆔 LP ID:', lpId);
      console.log('📦 Product Type:', productType);
      
      // sendClaimEmailを直接呼び出し
      const { sendClaimEmail } = await import('./utils/email');
      const requestId = 'test-' + Date.now();
      
      console.log('📤 Sending email...');
      await sendClaimEmail(email, requestId, tenant, lpId);
      console.log('✅ Email sent successfully');
      
      res.json({
        ok: true,
        message: "メールを送信しました。受信ボックスをご確認ください。",
        data: {
          email,
          tenant,
          lpId,
          productType,
          requestId,
          timestamp: new Date().toISOString(),
        },
      });
      
    } catch (error) {
      console.error("❌ lpForm error:", error);
      res.status(500).json({
        ok: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

