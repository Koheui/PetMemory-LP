/**
 * テスト用シンプルサーバー
 * LP の API 動作確認用
 */

const http = require('http');
const url = require('url');

const port = 5001;

// CORS ヘッダーを追加
function addCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

// レスポンス送信ヘルパー
function sendJSON(res, statusCode, data) {
    addCorsHeaders(res);
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}

// サーバー作成
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    console.log(`${new Date().toISOString()} ${method} ${path}`);

    // CORS プリフライト対応
    if (method === 'OPTIONS') {
        addCorsHeaders(res);
        res.statusCode = 200;
        res.end();
        return;
    }

    // ヘルスチェック
    if (path === '/health' || path === '/petmemory-lp/asia-northeast1/api/health') {
        sendJSON(res, 200, {
            ok: true,
            message: 'Test server is healthy',
            timestamp: new Date().toISOString(),
            server: 'test-server'
        });
        return;
    }

    // LP フォーム API のモック
    if (path === '/api/gate/lp-form' || path === '/petmemory-lp/asia-northeast1/api/api/gate/lp-form') {
        if (method !== 'POST') {
            sendJSON(res, 405, {
                ok: false,
                message: 'Method not allowed',
                error: 'METHOD_NOT_ALLOWED'
            });
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('Received form data:', data);

                // 簡単なバリデーション
                if (!data.email || !data.tenant || !data.lpId || !data.productType) {
                    sendJSON(res, 400, {
                        ok: false,
                        message: '必須フィールドが不足しています',
                        error: 'MISSING_FIELDS'
                    });
                    return;
                }

                // メールアドレスの簡単なバリデーション
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    sendJSON(res, 400, {
                        ok: false,
                        message: '無効なメールアドレスです',
                        error: 'INVALID_EMAIL'
                    });
                    return;
                }

                // 成功レスポンス
                const requestId = 'test_' + Date.now();
                sendJSON(res, 200, {
                    ok: true,
                    message: 'メールを送信しました。受信ボックスをご確認ください。',
                    data: {
                        requestId: requestId,
                        email: data.email,
                        tenant: data.tenant,
                        lpId: data.lpId,
                        productType: data.productType,
                        testMode: true
                    }
                });

                console.log(`✅ Form submission successful for ${data.email}`);

            } catch (error) {
                console.error('Error parsing request body:', error);
                sendJSON(res, 400, {
                    ok: false,
                    message: 'リクエストボディが無効です',
                    error: 'INVALID_JSON'
                });
            }
        });

        return;
    }

    // 404
    sendJSON(res, 404, {
        ok: false,
        message: 'Endpoint not found',
        error: 'NOT_FOUND',
        path: path
    });
});

// サーバー起動
server.listen(port, () => {
    console.log('🚀 Test server started!');
    console.log(`📡 Server running at http://localhost:${port}/`);
    console.log('📋 Available endpoints:');
    console.log('  - GET  /health');
    console.log('  - POST /api/gate/lp-form');
    console.log('  - POST /petmemory-lp/asia-northeast1/api/api/gate/lp-form');
    console.log('');
    console.log('🧪 Test URLs:');
    console.log('  - LP: http://localhost:3000/');
    console.log('  - Test Dashboard: file://' + __dirname + '/test.html');
    console.log('');
});

// エラーハンドリング
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down test server...');
    server.close(() => {
        console.log('✅ Test server stopped.');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
