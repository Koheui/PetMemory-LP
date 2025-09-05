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
 * テナント・LP・プロダクトタイプに応じたメール設定を取得（動的対応）
 */
function getEmailConfig(tenant: string, lpId: string, productType: string, emailConfig?: {
  headerTitle?: string;
  headerSubtitle?: string;
  mainMessage?: string;
  buttonText?: string;
  footerMessage?: string;
  claimEmailSubject?: string;
  confirmationEmailSubject?: string;
}) {
  // テナント名を適切なブランド名に変換
  const getBrandName = (tenant: string): string => {
    const brandMap: { [key: string]: string } = {
      'petmem': 'PetMemory',
      'futurestudio': 'emolink',
      'emolink': 'エモリンククラウド',
      // 新しいテナントは自動的にテナント名をブランド名として使用
    };
    
    return brandMap[tenant] || tenant.charAt(0).toUpperCase() + tenant.slice(1);
  };

  // プロダクトタイプに応じたメッセージを生成
  const getProductMessage = (productType: string): string => {
   
    const productMessages: { [key: string]: string } = {
      'acrylic': 'NFCタグ付きアクリルスタンド',
      'digital': 'デジタル想い出ページ',
      'premium': 'プレミアム想い出サービス',
      'standard': 'スタンダード想い出サービス',
      // 新しいプロダクトタイプは自動的にプロダクト名を使用
    };
    
    return productMessages[productType] || productType;
  };

  // 動的にメール設定を生成
  const brandName = getBrandName(tenant);
  const productName = getProductMessage(productType);
  
  const config = {
    headerTitle: emailConfig?.headerTitle || brandName,
    headerSubtitle: emailConfig?.headerSubtitle || "想い出を永遠に",
    mainMessage: emailConfig?.mainMessage || `${brandName}へのお申し込みありがとうございます。${productName}で大切な想い出を残しましょう。`,
    buttonText: emailConfig?.buttonText || "想い出ページを作成する",
    footerMessage: emailConfig?.footerMessage || `${brandName} - 想い出を永遠に`,
    // メールタイトル
    claimEmailSubject: emailConfig?.claimEmailSubject || `${brandName} - ${productName}のご案内`,
    confirmationEmailSubject: emailConfig?.confirmationEmailSubject || `${brandName} - お申し込み確認`
  };

  return config;
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
          <p style="font-size: 10px; color: #9ca3af; margin-top: 8px;">v1.1.1</p>
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
  lpId: string,
  productType: string,
  emailConfig?: {
    headerTitle?: string;
    headerSubtitle?: string;
    mainMessage?: string;
    buttonText?: string;
    footerMessage?: string;
    claimEmailSubject?: string;
    confirmationEmailSubject?: string;
  }
): string {
  const config = getEmailConfig(tenant, lpId, productType, emailConfig);
  
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
  const config = getEmailConfig(tenant, lpId, productType);
  
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
  lpId: string,
  productType: string,
  emailConfig?: {
    headerTitle?: string;
    headerSubtitle?: string;
    mainMessage?: string;
    buttonText?: string;
    footerMessage?: string;
    claimEmailSubject?: string;
    confirmationEmailSubject?: string;
  }
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
      const emailSettings = getEmailConfig(tenant, lpId, productType, emailConfig);
      const subject = emailSettings.claimEmailSubject;
      const htmlContent = generateClaimEmailTemplate(email, continueUrl, requestId, tenant, lpId, productType, emailConfig);
      
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
  lpId: string,
  emailConfig?: {
    headerTitle?: string;
    headerSubtitle?: string;
    mainMessage?: string;
    buttonText?: string;
    footerMessage?: string;
    claimEmailSubject?: string;
    confirmationEmailSubject?: string;
  }
): Promise<void> {
  try {
    const config = getEnvironmentConfig();
    
    // Gmail SMTP でメール送信を試行
    if (config.GMAIL_USER && config.GMAIL_APP_PASSWORD) {
      const emailSettings = getEmailConfig(tenant, lpId, productType, emailConfig);
      const subject = emailSettings.confirmationEmailSubject;
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

/**
 * 秘密鍵メール送信（Secret Key v1.0仕様）
 */
export async function sendSecretKeyEmail(
  email: string,
  secretKey: string,
  labels: {
    tenantId: string;
    lpId: string;
    productType: string;
  }
): Promise<void> {
  try {
    
    // プロダクトタイプ名のマッピング
    const productTypeNames = {
      'acrylic': 'NFCタグ付きアクリルスタンド',
      'digital': 'デジタル想い出ページ',
      'premium': 'プレミアム想い出サービス',
      'standard': 'スタンダード想い出サービス'
    };
    
    // テナント名のマッピング
    const tenantNames = {
      'petmem': 'PetMemory',
      'futurestudio': 'Future Studio',
      'newcompany': 'New Company'
    };
    
    const brandName = (tenantNames as any)[labels.tenantId] || labels.tenantId;
    const productName = (productTypeNames as any)[labels.productType] || labels.productType;
    
    const subject = `${brandName} - 秘密鍵のお知らせ`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
          }
          .secret-key-box {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #1f2937;
          }
          .order-details {
            background: #f0f8ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .order-details h3 {
            margin-top: 0;
            color: #1e40af;
          }
          .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .cta-button:hover {
            background: #1d4ed8;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${brandName}</h1>
            <p>決済が完了しました</p>
          </div>
          
          <p>お支払いありがとうございます。以下の秘密鍵でCMSにログインしてください。</p>
          
          <div class="secret-key-box">
            ${secretKey}
          </div>
          
          <div class="order-details">
            <h3>注文詳細</h3>
            <p><strong>プロダクト:</strong> ${productName}</p>
            <p><strong>テナント:</strong> ${brandName}</p>
            <p><strong>LP:</strong> ${labels.lpId}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://emolink.net" class="cta-button">CMSにアクセス</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ 重要な注意事項</strong>
            <ul style="margin: 10px 0;">
              <li>この秘密鍵は30日間有効です</li>
              <li>秘密鍵は一度使用すると無効になります</li>
              <li>秘密鍵を他人と共有しないでください</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>このメールは自動送信されています。</p>
            <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmailWithGmail(email, subject, htmlContent);
    
    console.log('📧 秘密鍵メール送信完了:', {
      email: email,
      secretKey: secretKey.substring(0, 8) + '...',
      tenant: labels.tenantId,
      lpId: labels.lpId,
      productType: labels.productType
    });
    
  } catch (error) {
    console.error("Failed to send secret key email:", error);
    throw new Error("秘密鍵メール送信に失敗しました");
  }
}
