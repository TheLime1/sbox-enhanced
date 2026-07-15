import { readFile } from "node:fs/promises"
import path from "node:path"
import { stdout } from "node:process"

const root = path.resolve(import.meta.dirname, "..")
const buildDirectory = path.join(root, "build", "firefox-mv3-prod")
const report = JSON.parse(
  await readFile(path.join(root, "build", "web-ext-lint.json"), "utf8")
)
const manifest = JSON.parse(
  await readFile(path.join(buildDirectory, "manifest.json"), "utf8")
)

async function isKnownReactWarning(warning) {
  if (
    warning.code !== "UNSAFE_VAR_ASSIGNMENT" ||
    !warning.file?.endsWith(".js") ||
    !warning.line ||
    !warning.column
  ) {
    return false
  }

  const source = await readFile(path.join(buildDirectory, warning.file), "utf8")
  const line = source.split(/\r?\n/)[warning.line - 1] ?? ""
  const start = Math.max(0, warning.column - 350)
  const end = Math.min(line.length, warning.column + 350)
  const context = line.slice(start, end)

  return (
    context.includes('case"dangerouslySetInnerHTML"') &&
    context.includes(".innerHTML=")
  )
}

function isKnownDesktopConsentWarning(warning) {
  const gecko = manifest.browser_specific_settings?.gecko

  return (
    warning.code === "KEY_FIREFOX_ANDROID_UNSUPPORTED_BY_MIN_VERSION" &&
    warning.file === "manifest.json" &&
    gecko?.strict_min_version === "140.0" &&
    JSON.stringify(gecko?.data_collection_permissions?.required) ===
      JSON.stringify(["none"]) &&
    manifest.browser_specific_settings?.gecko_android === undefined
  )
}

const unexpectedWarnings = []

for (const warning of report.warnings ?? []) {
  if (
    !isKnownDesktopConsentWarning(warning) &&
    !(await isKnownReactWarning(warning))
  ) {
    unexpectedWarnings.push(warning)
  }
}

if ((report.errors?.length ?? 0) > 0 || unexpectedWarnings.length > 0) {
  const failures = [...(report.errors ?? []), ...unexpectedWarnings]
    .map(
      (item) =>
        `${item.code}: ${item.message} (${item.file ?? "unknown file"})`
    )
    .join("\n")

  throw new Error(`Firefox extension validation failed:\n${failures}`)
}

stdout.write(
  `web-ext validation passed with 0 errors and ${(report.warnings ?? []).length} reviewed framework/platform warnings.\n`
)
