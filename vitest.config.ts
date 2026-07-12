import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const assetMock = fileURLToPath(
  new URL("./tests/mocks/inline-asset.ts", import.meta.url)
)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^data-base64:.+$/,
        replacement: assetMock
      }
    ]
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://sbox.game/"
      }
    },
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  }
})
