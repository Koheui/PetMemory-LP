import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/lp-petmem', // 新しいLPのルート
  define: {
    'import.meta.env': JSON.stringify(process.env)
  },
  build: {
    outDir: '../lp_petmem_dist', // 新しいLPの出力ディレクトリ
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/lp-petmem/index.html')
      }
    }
  },
  server: {
    port: 3001, // 別ポートで開発サーバー
    host: '0.0.0.0',
    open: true
  }
})

