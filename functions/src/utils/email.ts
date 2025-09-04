/**
 * Gmail SMTP を使用したメール送信機能
 */

import * as nodemailer from 'nodemailer';
import * as admin from "firebase-admin";
import { generateClaimToken } from "./helpers";
import { getEnvironmentConfig } from "./config";

/**
 * Gmail SMTP トランスポーターの作成
 */
function createGmailTransporter() {
  const config = getEnvironmentConfig();
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.GMAIL_USER,
      pass: config.GMAIL_APP_PASSWORD // Gmailアプリパスワードを使用
    },
    secure: true,
    port: 465
  });
}

/**
 * Gmail SMTP を使用したメール送信
 */
async function sendEmailWithGmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const config = getEnvironmentConfig();
  
  if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not configured, using Firebase Auth email link");
    return;
  }

  try {
    const transporter = createGmailTransporter();
    
    const mailOptions = {
      from: `"emolink" <${config.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully via Gmail SMTP");
  } catch (error) {
    console.error("Gmail SMTP email error:", error);
    throw new Error("メール送信に失敗しました");
  }
}

/**
 * クレーム用メールテンプレート
 */
function generateClaimEmailTemplate(
  email: string,
  claimUrl: string,
  requestId: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>emolink - 想い出ページ作成のご案内</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>emolink</h1>
          <p>想い出ページ作成のご案内</p>
        </div>
        
        <div class="content">
          <h2>${email} 様</h2>
          
          <p>emolinkへのお申し込みありがとうございます。</p>
          
          <p>下記のリンクから想い出ページの作成を開始してください。</p>
          
          <div style="text-align: center;">
            <a href="${claimUrl}" class="button">想い出ページを作成する</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ ご注意</strong><br>
            • このリンクの有効期限は72時間です<br>
            • リンクは一度だけ使用できます<br>
            • 他人と共有しないでください
          </div>
          
          <p><strong>リクエストID:</strong> ${requestId}</p>
          
          <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
        </div>
        
        <div class="footer">
          <p>emolink - 大切な想い出を永遠に</p>
          <p>このメールは自動送信されています。返信はできません。</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * メール送信処理
 */
export async function sendClaimEmail(
  email: string,
  requestId: string,
  tenant: string,
  lpId: string
): Promise<void> {
  try {
    const config = getEnvironmentConfig();
    
    // クレーム用のJWTトークン生成
    const claimToken = generateClaimToken({
      requestId,
      email,
      tenant,
      lpId,
    });

    // continueURL の構築
    const continueUrl = `${config.APP_CLAIM_CONTINUE_URL}?rid=${requestId}&tenant=${tenant}&lpId=${lpId}&k=${claimToken}`;

    // Gmail SMTP でメール送信を試行
    if (config.GMAIL_USER && config.GMAIL_APP_PASSWORD) {
      const subject = "emolink - 想い出ページ作成のご案内";
      const htmlContent = generateClaimEmailTemplate(email, continueUrl, requestId);
      
      await sendEmailWithGmail(email, subject, htmlContent);
      return;
    }

    // Gmail が設定されていない場合は Firebase Auth を使用
    console.log("Using Firebase Auth email link as fallback");
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };

    await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
    console.log("Firebase Auth email link generated");

  } catch (error) {
    console.error("Failed to send claim email:", error);
    throw new Error("メール送信に失敗しました");
  }
}
