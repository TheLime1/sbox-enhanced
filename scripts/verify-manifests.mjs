import { readFile } from "node:fs/promises"
import path from "node:path"
import { stdout } from "node:process"

const root = path.resolve(import.meta.dirname, "..")

async function readManifest(target) {
  const manifestPath = path.join(root, "build", target, "manifest.json")

  try {
    return JSON.parse(await readFile(manifestPath, "utf8"))
  } catch (error) {
    throw new Error(`Unable to read ${manifestPath}. Run pnpm build first.`, {
      cause: error
    })
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const [chromeManifest, firefoxManifest] = await Promise.all([
  readManifest("chrome-mv3-prod"),
  readManifest("firefox-mv3-prod")
])

assert(
  chromeManifest.browser_specific_settings === undefined,
  "Chromium manifest must not contain Firefox-specific settings."
)
assert(
  firefoxManifest.browser_specific_settings?.gecko?.id === "@sbox-enhanced",
  "Firefox manifest must use the permanent @sbox-enhanced add-on ID."
)
assert(
  firefoxManifest.browser_specific_settings?.gecko?.strict_min_version ===
    "140.0",
  "Firefox manifest must require Firefox 140 or newer."
)
assert(
  JSON.stringify(
    firefoxManifest.browser_specific_settings?.gecko
      ?.data_collection_permissions?.required
  ) === JSON.stringify(["none"]),
  "Firefox manifest must declare that no data is collected."
)
assert(
  firefoxManifest.browser_specific_settings?.gecko_android === undefined,
  "Firefox for Android must not be declared."
)
assert(
  chromeManifest.manifest_version === 3 &&
    firefoxManifest.manifest_version === 3,
  "Both production manifests must use Manifest V3."
)
assert(
  JSON.stringify(chromeManifest.permissions ?? []) === JSON.stringify([]) &&
    JSON.stringify(firefoxManifest.permissions ?? []) === JSON.stringify([]),
  "Neither browser build should request extension API permissions."
)

stdout.write("Chromium and Firefox production manifests are valid.\n")
