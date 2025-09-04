/**
 * Firebase Functions エントリーポイント
 */

import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { handleLpForm } from "./api/lpForm";
import { handleLogin, handleVerifyEmail, handleLogout } from "./api/auth";
import { getAllowedOrigins } from "./utils/config";

// Express アプリケーションの作成
const app = express();

// CORS 設定
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();
    
    // origin が undefined の場合（same-origin requests）は許可
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("CORS: Origin not allowed"), false);
    }
  },
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

