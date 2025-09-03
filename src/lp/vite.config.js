import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  root: ".",
  build: {
    outDir: "lp_dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html")
      }
    }
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    open: true
  }
})
