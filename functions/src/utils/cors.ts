/**
 * CORS設定ユーティリティ
 */

import { Request, Response } from 'express';

export const cors = (req: Request, res: Response): void => {
  // CORS ヘッダーを設定
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // OPTIONS リクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
};
