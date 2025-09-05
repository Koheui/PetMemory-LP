# 🎯 純粋CMS設計書

## 📋 **概要**

CMSは純粋なコンテンツ管理システムとして、様々な事業者から利用できる汎用バックエンドサービスに徹する。

## 🎯 **CMSの責任範囲**

### **✅ CMSが担当する機能**
1. **認証管理** - 秘密鍵認証システム
2. **コンテンツ管理** - 想い出ページの作成・編集
3. **データ保存** - Firestoreでのデータ管理
4. **NFCタグ管理** - タグとページの紐付け
5. **公開管理** - ページの公開・非公開制御

### **❌ CMSが担当しない機能**
1. **制作管理** - 各事業者の制作システムに委譲
2. **配送管理** - 各事業者の配送システムに委譲
3. **決済管理** - 各事業者の決済システムに委譲
4. **顧客管理** - 各事業者の顧客管理システムに委譲

## 🏗️ **アーキテクチャ設計**

### **CMS中心のアーキテクチャ**
```
各事業者のLP
├── 自社LP (アクリルスタンド)
├── 赤ちゃん筆事業者LP
├── その他事業者LP
└── ...

↓ 決済・認証

CMS (emolink.net)
├── 認証システム
├── コンテンツ管理
├── NFCタグ管理
└── データベース

↓ 制作依頼

各事業者の制作システム
├── 自社制作システム
├── 赤ちゃん筆制作システム
└── その他制作システム
```

## 🔄 **データフロー**

### **1. 決済完了時**
```
LP決済完了 → 秘密鍵生成 → CMS認証準備 → メール送信
```

### **2. CMSアクセス時**
```
メールリンク → 秘密鍵認証 → CMSダッシュボード → コンテンツ作成
```

### **3. 制作依頼時**
```
CMS完了 → 制作依頼API → 各事業者システム → 制作開始
```

## 🛠️ **CMS機能設計**

### **1. 認証システム**
```javascript
// 秘密鍵認証
async function authenticateWithSecretKey(secretKey) {
  // 1. 秘密鍵検証
  const secretKeyData = await validateSecretKey(secretKey);
  
  // 2. セッション作成
  const session = await createSession(secretKeyData);
  
  // 3. CMSダッシュボード表示
  return redirectToDashboard(session);
}
```

### **2. コンテンツ管理**
```javascript
// 想い出ページ作成
class MemoryPageManager {
  // ページ作成
  async createPage(userId, pageData) {
    const page = await db.collection('memoryPages').add({
      userId,
      ...pageData,
      status: 'draft',
      createdAt: new Date()
    });
    return page;
  }
  
  // ページ編集
  async updatePage(pageId, updates) {
    await db.collection('memoryPages').doc(pageId).update({
      ...updates,
      updatedAt: new Date()
    });
  }
  
  // ページ公開
  async publishPage(pageId) {
    await db.collection('memoryPages').doc(pageId).update({
      status: 'published',
      publishedAt: new Date()
    });
  }
}
```

### **3. NFCタグ管理**
```javascript
// NFCタグとページの紐付け
class NFCTagManager {
  // タグ生成
  async generateTag(pageId) {
    const tagId = generateUniqueTagId();
    await db.collection('nfcTags').doc(tagId).set({
      pageId,
      status: 'active',
      createdAt: new Date()
    });
    return tagId;
  }
  
  // タグ読み取り
  async readTag(tagId) {
    const tag = await db.collection('nfcTags').doc(tagId).get();
    if (tag.exists) {
      return tag.data();
    }
    return null;
  }
}
```

## 🔗 **事業者連携API**

### **1. 制作依頼API**
```javascript
// 各事業者への制作依頼
app.post('/api/production/request', async (req, res) => {
  const { pageId, tenantId, productionData } = req.body;
  
  // 1. ページデータ取得
  const page = await getMemoryPage(pageId);
  
  // 2. 事業者別の制作依頼
  const productionRequest = await createProductionRequest({
    tenantId,
    pageData: page,
    productionData,
    status: 'pending'
  });
  
  // 3. 事業者システムに通知
  await notifyProductionSystem(tenantId, productionRequest);
  
  res.json({ success: true, requestId: productionRequest.id });
});
```

### **2. 事業者別設定**
```javascript
// 事業者別の設定管理
const tenantConfigs = {
  'petmem': {
    name: 'PetMemory',
    productionSystem: 'https://production.petmem.com/api',
    supportedProducts: ['acrylic'],
    nfcEnabled: true
  },
  'babybrush': {
    name: '赤ちゃん筆事業者',
    productionSystem: 'https://production.babybrush.com/api',
    supportedProducts: ['brush'],
    nfcEnabled: false
  }
};
```

## 📊 **データベース設計**

### **1. コアテーブル**
```javascript
// 想い出ページ
memoryPages: {
  id: string,
  userId: string,
  tenantId: string,
  title: string,
  content: object,
  status: 'draft' | 'published' | 'archived',
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt?: timestamp
}

// NFCタグ
nfcTags: {
  id: string,
  pageId: string,
  status: 'active' | 'inactive',
  createdAt: timestamp
}

// 制作依頼
productionRequests: {
  id: string,
  pageId: string,
  tenantId: string,
  status: 'pending' | 'in_progress' | 'completed',
  productionData: object,
  createdAt: timestamp
}
```

### **2. 事業者別テーブル**
```javascript
// 事業者設定
tenants: {
  id: string,
  name: string,
  productionSystemUrl: string,
  supportedProducts: string[],
  nfcEnabled: boolean,
  settings: object
}
```

## 🎨 **CMS UI設計**

### **1. ダッシュボード**
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 想い出ページ管理                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ 📝 新規作成  │ │ 📋 ページ一覧│ │ ⚙️ 設定      │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                         │
│ 最近のページ:                                           │
│ • ペットの想い出ページ (下書き)                         │
│ • 家族の想い出ページ (公開済み)                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **2. ページ編集画面**
```
┌─────────────────────────────────────────────────────────┐
│ 📝 ページ編集                                           │
├─────────────────────────────────────────────────────────┤
│ タイトル: [________________]                           │
│                                                         │
│ コンテンツ:                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 写真アップロード                                     │ │
│ │ テキスト入力                                         │ │
│ │ レイアウト選択                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [下書き保存] [プレビュー] [公開]                        │
└─────────────────────────────────────────────────────────┘
```

## 🔒 **セキュリティ設計**

### **1. 認証・認可**
- **秘密鍵認証** - 一時的なアクセス制御
- **テナント分離** - 事業者間のデータ分離
- **権限管理** - ページごとのアクセス制御

### **2. データ保護**
- **暗号化** - 機密データの暗号化
- **バックアップ** - 定期的なデータバックアップ
- **監査ログ** - すべての操作の記録

## 🚀 **実装優先順位**

### **Phase 1: コアCMS機能 (2週間)**
1. 秘密鍵認証システム
2. 基本的なページ管理
3. NFCタグ管理

### **Phase 2: 事業者連携 (1週間)**
1. 制作依頼API
2. 事業者別設定
3. 通知システム

### **Phase 3: 高度機能 (1週間)**
1. 高度な編集機能
2. テンプレートシステム
3. 分析・統計機能

## 💡 **CMSの価値提案**

### **1. 事業者にとって**
- **開発コスト削減** - CMS機能の開発不要
- **運用負荷軽減** - コンテンツ管理の自動化
- **スケーラビリティ** - 顧客数増加に対応

### **2. 顧客にとって**
- **統一体験** - どの事業者でも同じ操作感
- **データ永続性** - 長期間のデータ保存
- **NFCアクセス** - 簡単なアクセス方法

### **3. 自社にとって**
- **収益源** - 事業者へのCMS提供料金
- **データ資産** - 蓄積されたデータの活用
- **技術優位性** - CMS技術の蓄積

この純粋CMS設計により、様々な事業者から利用できる汎用バックエンドサービスとしての価値を最大化できます！
