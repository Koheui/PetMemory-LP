import { defineConfig } from "vite"

export default defineConfig({
  root: ".",
  build: {
    outDir: "lp_dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "./index.html",
        payment: "./payment.html",
        "payment-success": "./payment-success.html",
        legal: "./legal.html"
      }
    }
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    open: true
  },
  // JavaScriptファイルを正しく処理するための設定
  optimizeDeps: {
    include: ['js/main.js']
  }
})
