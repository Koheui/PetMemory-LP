/**
 * Firebase Functions エントリーポイント
 */

import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { handleLpForm } from "./api/lpForm";
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// JSON パースの設定
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ヘルスチェック
app.get("/health", (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    ok: true,
    message: "PetMemory Functions API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// API ルーティング
app.post("/api/gate/lp-form", handleLpForm);

// 404 ハンドラー
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    ok: false,
    message: "Endpoint not found",
    error: "NOT_FOUND",
  });
});

// エラーハンドラー
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Express error:", error);
  
  if (error.message.includes("CORS")) {
    res.status(403).json({
      ok: false,
      message: "CORS policy violation",
      error: "FORBIDDEN",
    });
    return;
  }
  
  res.status(500).json({
    ok: false,
    message: "Internal server error",
    error: "INTERNAL_ERROR",
  });
});

// Functions のエクスポート
export const api = functions
  .region("asia-northeast1") // 東京リージョン
  .runWith({
    timeoutSeconds: 60,
    memory: "512MB",
    minInstances: 0,
    maxInstances: 10,
  })
  .https
  .onRequest(app);

// 個別の Function も定義（必要に応じて）
export const lpForm = functions
  .region("asia-northeast1")
  .runWith({
    timeoutSeconds: 30,
    memory: "256MB",
  })
  .https
  .onRequest(async (req, res) => {
    // CORS ヘッダーを手動で設定
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();
    
    if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes("*"))) {
      res.set("Access-Control-Allow-Origin", origin);
    }
    
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    
    if (req.method !== "POST") {
      res.status(405).json({
        ok: false,
        message: "Method not allowed",
        error: "METHOD_NOT_ALLOWED",
      });
      return;
    }
    
    await handleLpForm(req, res);
  });

// その他の Functions（将来追加予定）

/**
 * 公開ページビルド Function
 */
export const publishPage = functions
  .region("asia-northeast1")
  .runWith({
    timeoutSeconds: 180,
    memory: "1GB",
  })
  .https
  .onRequest(async (req, res) => {
    // 実装予定
    res.status(501).json({
      ok: false,
      message: "Not implemented yet",
      error: "NOT_IMPLEMENTED",
    });
  });

/**
 * Webhooks ハンドラー
 */
export const webhooks = functions
  .region("asia-northeast1")
  .runWith({
    timeoutSeconds: 30,
    memory: "256MB",
  })
  .https
  .onRequest(async (req, res) => {
    // Stripe webhook などの実装予定
    res.status(501).json({
      ok: false,
      message: "Not implemented yet",
      error: "NOT_IMPLEMENTED",
    });
  });

/**
 * スケジュールタスク
 */
export const scheduledTasks = functions
  .region("asia-northeast1")
  .runWith({
    timeoutSeconds: 300,
    memory: "512MB",
  })
  .pubsub
  .schedule("0 2 * * *") // 毎日2時に実行
  .timeZone("Asia/Tokyo")
  .onRun(async (context) => {
    console.log("Scheduled task started:", context.timestamp);
    
    // 期限切れのclaimRequestsのクリーンアップなど
    // 実装予定
    
    console.log("Scheduled task completed");
    return null;
  });
