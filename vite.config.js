import { defineConfig } from 'vite'

export default defineConfig({
  // 環境変数の設定
  define: {
    'import.meta.env': JSON.stringify(process.env)
  },
  
  // ビルド設定
  build: {
    outDir: 'lp_dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'src/lp/index.html'
      }
    }
  },
  
  // 開発サーバー設定
  server: {
    port: 3000,
    host: true
  }
})
