# 🎯 LP機能設計ガイド

## 📋 **LPの役割と機能**

### **LPの主要機能**
1. **サインアップフォーム** - メールアドレス入力
2. **メール認証** - 認証リンクの送信
3. **認証完了** - 14日間無料利用開始
4. **ログイン画面** - 既存ユーザーのログイン

### **CMSの機能**
- 認証後のメインアプリケーション
- 想い出ページの作成・管理
- ユーザー管理・設定

## 🔄 **ユーザーフロー**

### **新規ユーザー**
```
LP (サインアップ)
    ↓
メール認証リンク送信
    ↓
メール内のリンクをクリック
    ↓
認証完了 → 14日間無料利用開始
    ↓
CMS (メインアプリケーション)
```

### **既存ユーザー**
```
LP (ログイン画面)
    ↓
ログイン認証
    ↓
CMS (メインアプリケーション)
```

## 🏗️ **技術実装**

### **1. サインアップフォーム**

#### **HTML構造**
```html
<!-- サインアップフォーム -->
<form id="signupForm" class="signup-form">
  <div class="form-group">
    <label for="email">メールアドレス</label>
    <input type="email" id="email" name="email" required>
  </div>
  <button type="submit" class="btn-primary">
    14日間無料で始める
  </button>
</form>

<!-- ログインフォーム -->
<form id="loginForm" class="login-form">
  <div class="form-group">
    <label for="loginEmail">メールアドレス</label>
    <input type="email" id="loginEmail" name="email" required>
  </div>
  <div class="form-group">
    <label for="password">パスワード</label>
    <input type="password" id="password" name="password" required>
  </div>
  <button type="submit" class="btn-primary">
    ログイン
  </button>
</form>
```

#### **JavaScript処理**
```javascript
// サインアップ処理
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        tenantId: window.VITE_TENANT_ID,
        lpId: window.VITE_LP_ID
      })
    });
    
    if (response.ok) {
      showSuccessMessage('認証メールを送信しました。メールをご確認ください。');
    } else {
      showErrorMessage('エラーが発生しました。もう一度お試しください。');
    }
  } catch (error) {
    showErrorMessage('ネットワークエラーが発生しました。');
  }
});

// ログイン処理
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        tenantId: window.VITE_TENANT_ID
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      // ログイン成功 → CMSにリダイレクト
      window.location.href = data.redirectUrl;
    } else {
      showErrorMessage('ログインに失敗しました。');
    }
  } catch (error) {
    showErrorMessage('ネットワークエラーが発生しました。');
  }
});
```

### **2. バックエンドAPI**

#### **サインアップAPI**
```typescript
// functions/src/api/signup.ts
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, tenantId, lpId } = req.body;
    
    // 1. メールアドレスの検証
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    // 2. 既存ユーザーのチェック
    const existingUser = await checkExistingUser(email, tenantId);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // 3. 認証リンクの生成
    const authToken = generateAuthToken(email, tenantId);
    const authUrl = `${getCMSBaseUrl(tenantId)}/auth/verify?token=${authToken}`;
    
    // 4. メール送信
    await sendAuthEmail(email, authUrl, tenantId);
    
    // 5. 一時ユーザーレコードの作成
    await createTemporaryUser(email, tenantId, authToken);
    
    return res.json({
      success: true,
      message: '認証メールを送信しました'
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### **ログインAPI**
```typescript
// functions/src/api/login.ts
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, tenantId } = req.body;
    
    // 1. ユーザー認証
    const user = await authenticateUser(email, password, tenantId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 2. セッショントークンの生成
    const sessionToken = generateSessionToken(user.id, tenantId);
    
    // 3. CMSのURLを生成
    const cmsUrl = `${getCMSBaseUrl(tenantId)}/dashboard?token=${sessionToken}`;
    
    return res.json({
      success: true,
      redirectUrl: cmsUrl
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

### **3. メール認証フロー**

#### **認証リンク処理**
```typescript
// functions/src/api/authVerify.ts
export const authVerify = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    // 1. トークンの検証
    const userData = await verifyAuthToken(token as string);
    if (!userData) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // 2. ユーザーアカウントの有効化
    await activateUser(userData.email, userData.tenantId);
    
    // 3. 14日間無料利用の設定
    await setFreeTrial(userData.email, userData.tenantId, 14);
    
    // 4. セッショントークンの生成
    const sessionToken = generateSessionToken(userData.email, userData.tenantId);
    
    // 5. CMSにリダイレクト
    const cmsUrl = `${getCMSBaseUrl(userData.tenantId)}/dashboard?token=${sessionToken}`;
    
    return res.redirect(cmsUrl);
    
  } catch (error) {
    console.error('Auth verify error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

## 🎨 **UI/UX設計**

### **1. サインアップ画面**
- **ヒーローセクション**: サービスの説明
- **サインアップフォーム**: メールアドレス入力
- **メリット説明**: 14日間無料のメリット
- **信頼性**: セキュリティ・プライバシーの説明

### **2. ログイン画面**
- **シンプルなフォーム**: メールアドレス + パスワード
- **パスワードリセット**: パスワードを忘れた場合のリンク
- **新規登録リンク**: サインアップ画面への誘導

### **3. 認証完了画面**
- **成功メッセージ**: 認証完了の確認
- **自動リダイレクト**: CMSへの自動遷移
- **手動リンク**: リダイレクトが失敗した場合の手動リンク

## 🔧 **実装のポイント**

### **✅ セキュリティ**
- **reCAPTCHA**: ボット対策
- **レート制限**: メール送信の制限
- **トークン有効期限**: 認証リンクの有効期限設定

### **✅ ユーザビリティ**
- **レスポンシブデザイン**: モバイル対応
- **アクセシビリティ**: スクリーンリーダー対応
- **エラーハンドリング**: 分かりやすいエラーメッセージ

### **✅ パフォーマンス**
- **高速読み込み**: 最適化されたアセット
- **キャッシュ戦略**: 静的コンテンツのキャッシュ
- **CDN活用**: グローバル配信

## 🚀 **次のステップ**

### **Phase 1: 基本機能実装**
1. サインアップフォームの実装
2. メール送信機能の実装
3. 認証リンク処理の実装

### **Phase 2: ログイン機能実装**
1. ログインフォームの実装
2. 認証処理の実装
3. CMS連携の実装

### **Phase 3: UI/UX改善**
1. レスポンシブデザイン
2. アクセシビリティ対応
3. パフォーマンス最適化

---

*この設計で、ユーザーフレンドリーで安全なLPシステムを実現できます！*
