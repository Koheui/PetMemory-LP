#!/bin/bash

# emolink-lp デプロイスクリプト
echo "🚀 emolink-lp デプロイ開始..."

# 1. ビルド
echo "📦 ビルド中..."
cd src/lp
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ビルド失敗"
    exit 1
fi

echo "✅ ビルド完了"

# 2. デプロイ
echo "🌐 デプロイ中..."
cd ../..
firebase deploy --only hosting:emolink-lp

if [ $? -ne 0 ]; then
    echo "❌ デプロイ失敗"
    exit 1
fi

echo "✅ デプロイ完了"
echo "🌍 URL: https://emolink-lp.web.app"
