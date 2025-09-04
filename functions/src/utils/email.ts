/**
 * Gmail SMTP を使用したメール送信（迷惑フォルダ対策付き）
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
 * Gmail SMTP を使用したメール送信（迷惑フォルダ対策付き）
 */
async function sendEmailWithGmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const config = getEnvironmentConfig();
  
  if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not configured, using Firebase Auth email link");
    return;
  }

  try {
    const transporter = createGmailTransporter();
    
    // 迷惑フォルダ対策のためのメールオプション
    const mailOptions = {
      from: `"${config.GMAIL_USER.split('@')[0]}" <${config.GMAIL_USER}>`, // 送信者名を設定
      to: to,
      subject: subject,
      html: htmlContent,
      // 迷惑フォルダ対策のためのヘッダー
      headers: {
        'List-Unsubscribe': `<mailto:${config.GMAIL_USER}?subject=unsubscribe>`,
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'X-Mailer': 'emolink-system',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'normal',
        'X-Campaign': 'emolink-confirmation',
        'X-Report-Abuse': `Please report abuse here: mailto:${config.GMAIL_USER}?subject=abuse`,
      },
      // テキスト版も含める（HTMLのみだとスパム判定されやすい）
      text: generateTextVersion(htmlContent),
      // 返信先アドレスを設定
      replyTo: config.GMAIL_USER,
      // 送信者情報を明確化
      sender: config.GMAIL_USER,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully via Gmail SMTP");
  } catch (error) {
    console.error("Gmail SMTP email error:", error);
    throw new Error("メール送信に失敗しました");
  }
}

/**
 * HTMLからテキスト版を生成（迷惑フォルダ対策）
 */
function generateTextVersion(htmlContent: string): string {
  // 簡単なHTMLタグ除去
  return htmlContent
    .replace(/<[^>]*>/g, '') // HTMLタグを除去
    .replace(/&nbsp;/g, ' ') // 特殊文字を変換
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // 複数の空白を1つに
    .trim();
}

/**
 * テナント・LPに応じたメール設定を取得
 */
function getEmailConfig(tenant: string, lpId: string) {
  const config = getEnvironmentConfig();
  
  // 環境変数で指定されたテナント・LPIDの場合のみ有効
  if (tenant === config.DEFAULT_TENANT && lpId === config.DEFAULT_LP_ID) {
    return {
      headerTitle: "エモリンククラウド",
      headerSubtitle: "想い出を永遠に",
      mainMessage: "エモリンククラウドへのお申し込みありがとうございます。大切な想い出をで残しましょう。",
      buttonText: "想い出ページを作成する",
      footerMessage: "エモリンククラウド - 想い出を永遠に",
      // メールタイトル
      claimEmailSubject: "エモリンククラウド - 想い出ページ作成のご案内",
      confirmationEmailSubject: "エモリンククラウド - お申し込み確認"
    };
  }
  
  // それ以外の場合はエラー
  throw new Error(`Unsupported tenant/lpId combination: ${tenant}/${lpId}`);
}

/**
 * 共通メールテンプレート生成関数
 */
function generateCommonEmailTemplate(
  email: string,
  headerTitle: string,
  headerSubtitle: string,
  mainMessage: string,
  buttonText?: string,
  buttonUrl?: string,
  additionalInfo?: string,
  footerMessage?: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headerTitle} - ${headerSubtitle}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .info { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${headerTitle}</h1>
          <p>${headerSubtitle}</p>
        </div>
        
        <div class="content">
          <h2>${email} 様</h2>
          
          <p>${mainMessage}</p>
          
          ${buttonText && buttonUrl ? `
          <div style="text-align: center;">
            <a href="${buttonUrl}" class="button">${buttonText}</a>
          </div>
          ` : ''}
          
          ${additionalInfo ? `
          <div class="info">
            ${additionalInfo}
          </div>
          ` : ''}
          
          <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
        </div>
        
        <div class="footer">
          <p>${footerMessage || `${headerTitle} - 大切な想い出を永遠に`}</p>
          <p>このメールは自動送信されています。返信はできません。</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * クレーム用メールテンプレート（共通テンプレート使用）
 */
function generateClaimEmailTemplate(
  email: string,
  claimUrl: string,
  requestId: string,
  tenant: string,
  lpId: string
): string {
  const config = getEmailConfig(tenant, lpId);
  
  const additionalInfo = `
    <strong>⚠️ ご注意</strong><br>
    • このリンクの有効期限は72時間です<br>
    • リンクは一度だけ使用できます<br>
    • 他人と共有しないでください<br><br>
    <strong>リクエストID:</strong> ${requestId}
  `;

  return generateCommonEmailTemplate(
    email,
    config.headerTitle,
    config.headerSubtitle,
    config.mainMessage,
    config.buttonText,
    claimUrl,
    additionalInfo,
    config.footerMessage
  );
}

/**
 * フォーム送信者向け確認メールテンプレート（共通テンプレート使用）
 */
function generateConfirmationEmailTemplate(
  email: string,
  productType: string,
  requestId: string,
  tenant: string,
  lpId: string
): string {
  const config = getEmailConfig(tenant, lpId);
  
  const additionalInfo = `
    <strong>📋 申し込み内容</strong><br>
    • 商品タイプ: ${productType}<br>
    • 申し込み日時: ${new Date().toLocaleString('ja-JP')}<br>
    • リクエストID: ${requestId}<br><br>
    想い出ページ作成のリンクを別途メールでお送りいたします。
  `;

  return generateCommonEmailTemplate(
    email,
    config.headerTitle,
    "お申し込み確認",
    config.mainMessage,
    undefined, // ボタンなし
    undefined, // URLなし
    additionalInfo,
    config.footerMessage
  );
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
      const emailConfig = getEmailConfig(tenant, lpId);
      const subject = emailConfig.claimEmailSubject;
      const htmlContent = generateClaimEmailTemplate(email, continueUrl, requestId, tenant, lpId);
      
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

/**
 * フォーム送信者向け確認メール送信
 */
export async function sendConfirmationEmail(
  email: string,
  productType: string,
  requestId: string,
  tenant: string,
  lpId: string
): Promise<void> {
  try {
    const config = getEnvironmentConfig();
    
    // Gmail SMTP でメール送信を試行
    if (config.GMAIL_USER && config.GMAIL_APP_PASSWORD) {
      const emailConfig = getEmailConfig(tenant, lpId);
      const subject = emailConfig.confirmationEmailSubject;
      const htmlContent = generateConfirmationEmailTemplate(email, productType, requestId, tenant, lpId);
      
      await sendEmailWithGmail(email, subject, htmlContent);
      console.log("Confirmation email sent successfully");
      return;
    }

    console.log("Gmail not configured, skipping confirmation email");

  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    // 確認メールの失敗は致命的ではないので、エラーを投げない
  }
}
