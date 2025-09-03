# 🔍 reCAPTCHA秘密鍵の管理方法

## 📊 **管理アプローチの比較**

### **Option 1: 単一の秘密鍵で管理（推奨）**
```
CMS側（Firebase Functions）
├── reCAPTCHA秘密鍵: 1つ
├── サイトキー: LPごとに異なる
└── 検証: 統一された処理

LP側
├── LP1: サイトキーA
├── LP2: サイトキーB
└── LP3: サイトキーC
```

### **Option 2: LPごとに秘密鍵を分離**
```
CMS側（Firebase Functions）
├── reCAPTCHA秘密鍵: LPごとに異なる
├── サイトキー: LPごとに異なる
└── 検証: LPごとに異なる処理

LP側
├── LP1: 秘密鍵A + サイトキーA
├── LP2: 秘密鍵B + サイトキーB
└── LP3: 秘密鍵C + サイトキーC
```

## 🎯 **推奨アプローチ: 単一の秘密鍵で管理**

### **理由**
1. **管理の簡素化**: 1つの秘密鍵で全LPを管理
2. **コスト効率**: reCAPTCHAの追加料金なし
3. **設定の統一**: 一貫したセキュリティ設定
4. **運用効率**: 更新・管理が簡単

### **実装方法**

#### **1. reCAPTCHA設定**
```bash
# Google reCAPTCHA管理コンソール
# https://www.google.com/recaptcha/admin

# 1つのreCAPTCHAを作成
ドメイン: memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app
タイプ: reCAPTCHA v3
```

#### **2. サイトキーの管理**
```javascript
// LP側の環境変数（サイトキー）
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';  // 本番キー
```

#### **3. 秘密鍵の設定**
```bash
# CMS側の環境変数（秘密鍵）
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"
```

#### **4. 検証処理の統一**
```typescript
// functions/src/utils/recaptcha.ts
export async function verifyRecaptcha(token: string, action: string = 'lp_form'): Promise<number> {
  try {
    const secretKey = functions.config().recaptcha.secret_key;
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    
    if (data.success) {
      return data.score || 0;
    } else {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return 0;
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return 0;
  }
}
```

## 🔧 **LPごとの設定**

### **1. サイトキーの管理**
```javascript
// LP1 (example.com)
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';

// LP2 (petmem.com)
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';  // 同じキー

// LP3 (client-a.com)
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';  // 同じキー
```

### **2. ドメイン設定**
```bash
# Google reCAPTCHA管理コンソールで複数ドメインを追加
example.com
petmem.com
client-a.com
client-b.com
memorylink-cms-github-deploy--memorylink-cms.asia-east1.hosted.app
```

### **3. 環境変数の設定**
```bash
# 単一の秘密鍵を設定
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"

# 複数のサイトキーを管理（必要に応じて）
firebase functions:config:set recaptcha.site_keys="6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S,6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
```

## 🚀 **実装手順**

### **Phase 1: reCAPTCHA設定**
1. **Google reCAPTCHA管理コンソールで設定**
   - 1つのreCAPTCHA v3を作成
   - 複数ドメインを追加

2. **サイトキーと秘密鍵の取得**
   - サイトキー: LP側で使用
   - 秘密鍵: CMS側で使用

### **Phase 2: 環境変数の設定**
```bash
# プロジェクト選択
firebase use memorylink-cms

# reCAPTCHA秘密鍵設定
firebase functions:config:set recaptcha.secret_key="YOUR_RECAPTCHA_SECRET"
```

### **Phase 3: LP側の設定**
```javascript
// 各LPのindex.htmlで同じサイトキーを使用
window.VITE_RECAPTCHA_SITE_KEY = '6LehwrYrAAAAAMqLNsY-L2HV2pdduHNnPCvGCV3S';
```

## 💡 **重要なポイント**

### **✅ 利点**
- **管理の簡素化**: 1つの秘密鍵で全LP管理
- **コスト効率**: 追加料金なし
- **設定の統一**: 一貫したセキュリティ

### **✅ 注意点**
- **ドメイン制限**: reCAPTCHA管理コンソールでドメインを追加
- **スコア閾値**: 全LPで統一された閾値を使用
- **エラーハンドリング**: 統一されたエラー処理

### **✅ セキュリティ**
- **秘密鍵の保護**: 絶対にクライアント側に露出しない
- **ドメイン検証**: 許可されたドメインのみアクセス
- **スコア検証**: 適切な閾値での検証

## 🎯 **結論**

### **✅ 単一の秘密鍵で管理を推奨**
- **理由**: 管理の簡素化、コスト効率、設定の統一
- **実装**: 1つのreCAPTCHAで複数ドメインを管理
- **運用**: 統一された検証処理

### **🚀 次のステップ**
1. **reCAPTCHA管理コンソールでの設定**
2. **環境変数の設定**
3. **LP側のサイトキー設定**

---

*単一のreCAPTCHA秘密鍵で、効率的で安全なLP管理が実現できます！*
