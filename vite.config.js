import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // ルートディレクトリをsrc/lpに設定
  root: 'src/lp',
  
  // 環境変数の設定
  define: {
    'import.meta.env': JSON.stringify(process.env)
  },
  
  // ビルド設定
  build: {
    outDir: '../lp_dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/lp/index.html')
      }
    }
  },
  
  // 開発サーバー設定
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true
  }
})
