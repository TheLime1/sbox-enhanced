import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8")
)

describe("browser manifests", () => {
  it("declares the Firefox identity and no-data policy", () => {
    expect(packageJson.manifest.browser_specific_settings).toEqual({
      gecko: {
        id: "@sbox-enhanced",
        strict_min_version: "140.0",
        data_collection_permissions: {
          required: ["none"]
        }
      }
    })
  })

  it("keeps extension API permissions empty", () => {
    expect(packageJson.manifest.permissions).toEqual([])
  })

  it("provides parallel Chromium and Firefox commands", () => {
    expect(packageJson.scripts["build:chrome"]).toContain("chrome-mv3")
    expect(packageJson.scripts["build:firefox"]).toContain("firefox-mv3")
    expect(packageJson.scripts["package:chrome"]).toContain("build:chrome")
    expect(packageJson.scripts["package:firefox"]).toContain("build:firefox")
  })
})
