# 📧 SendGridを使わないメール送信方法

## 🔧 **代替メール送信方法**

### **1. Gmail SMTP（推奨）**

#### **✅ メリット**
- **無料で利用可能**
- **信頼性が高い**
- **設定が簡単**
- **Firebase Functionsと相性が良い**

#### **🔧 設定手順**

##### **Step 1: Gmailアプリパスワードの作成**
1. **Googleアカウント設定** → **セキュリティ**
2. **2段階認証を有効化**
3. **アプリパスワード** → **メール** → **生成**

##### **Step 2: Firebase Functions環境変数設定**
```bash
# Gmail SMTP設定
firebase functions:config:set email.service="gmail"
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
firebase functions:config:set email.from="your-email@gmail.com"
```

##### **Step 3: Firebase Functionsコード更新**
```typescript
// functions/src/api/lpForm.ts
import * as nodemailer from 'nodemailer';

// Gmail SMTP設定
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

// メール送信関数
async function sendEmail(to: string, subject: string, html: string) {
  const mailOptions = {
    from: functions.config().email.from,
    to: to,
    subject: subject,
    html: html
  };
  
  return await transporter.sendMail(mailOptions);
}
```

### **2. Firebase Auth Email Link（推奨）**

#### **✅ メリット**
- **Firebase標準機能**
- **設定不要**
- **セキュリティが高い**
- **パスワードレス認証**

#### **🔧 設定手順**

##### **Step 1: Firebase Auth設定**
```bash
# Firebase Auth設定
firebase functions:config:set auth.action_code_settings_url="https://memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app/claim"
firebase functions:config:set auth.action_code_settings_handle_code_in_app="true"
```

##### **Step 2: Firebase Functionsコード更新**
```typescript
// functions/src/api/lpForm.ts
import * as admin from 'firebase-admin';

// Firebase Auth Email Link送信
async function sendEmailLink(email: string, tenantId: string, lpId: string) {
  const actionCodeSettings = {
    url: functions.config().auth.action_code_settings_url,
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.petmemory.app'
    },
    android: {
      packageName: 'com.petmemory.app',
      installApp: true,
      minimumVersion: '12'
    },
    dynamicLinkDomain: 'petmemory.page.link'
  };

  const link = await admin.auth().generateEmailVerificationLink(
    email, 
    actionCodeSettings
  );

  // カスタムメール送信（Gmail SMTP使用）
  const html = `
    <h2>PetMemory アカウント認証</h2>
    <p>以下のリンクをクリックしてアカウントを認証してください：</p>
    <a href="${link}">アカウントを認証する</a>
    <p>このリンクは24時間有効です。</p>
  `;

  return await sendEmail(email, 'PetMemory アカウント認証', html);
}
```

### **3. その他のSMTPサービス**

#### **📧 Outlook/Hotmail**
```bash
firebase functions:config:set email.service="outlook"
firebase functions:config:set email.user="your-email@outlook.com"
firebase functions:config:set email.password="your-password"
```

#### **📧 Yahoo Mail**
```bash
firebase functions:config:set email.service="yahoo"
firebase functions:config:set email.user="your-email@yahoo.com"
firebase functions:config:set email.password="your-app-password"
```

#### **📧 カスタムSMTP**
```bash
firebase functions:config:set email.host="smtp.your-domain.com"
firebase functions:config:set email.port="587"
firebase functions:config:set email.secure="false"
firebase functions:config:set email.user="your-email@your-domain.com"
firebase functions:config:set email.password="your-password"
```

## 🚀 **推奨実装手順**

### **Phase 1: Gmail SMTP設定**
1. **Gmailアプリパスワード作成**
2. **Firebase Functions環境変数設定**
3. **コード更新とテスト**

### **Phase 2: Firebase Auth統合**
1. **Firebase Auth設定**
2. **Email Link生成**
3. **カスタムメールテンプレート**

### **Phase 3: 統合テスト**
1. **メール送信テスト**
2. **認証フロー確認**
3. **エラーハンドリング**

## 🔒 **セキュリティ注意事項**

### **✅ アプリパスワードの保護**
- **絶対にGitにコミットしない**
- **定期的な更新を検討**
- **不要なアプリパスワードは削除**

### **✅ メール送信制限**
- **1日あたりの送信制限を確認**
- **レート制限の実装**
- **スパム対策の実装**

---

*Gmail SMTP + Firebase Authで、安全で信頼性の高いメール送信システムを構築できます！*
