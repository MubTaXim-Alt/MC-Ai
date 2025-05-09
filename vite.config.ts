import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bot": path.resolve(__dirname, "./bot"),
    },
  },
  build: {
    outDir: 'dist/client', // Output client files to dist/client
  }
})
