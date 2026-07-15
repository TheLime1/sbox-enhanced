import { execFileSync } from "node:child_process"
import { mkdir, readFile, rm, stat } from "node:fs/promises"
import path from "node:path"
import { stdout } from "node:process"

const root = path.resolve(import.meta.dirname, "..")

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim()
}

const status = git(["status", "--porcelain", "--untracked-files=all"])

if (status) {
  throw new Error(
    "Source packages must come from a clean, committed worktree. Commit or stash all changes, then run pnpm release:firefox again."
  )
}

const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8")
)
const buildDirectory = path.join(root, "build")
const outputPath = path.join(
  buildDirectory,
  `${packageJson.name}-${packageJson.version}-source.zip`
)

await mkdir(buildDirectory, { recursive: true })
await rm(outputPath, { force: true })

execFileSync(
  "git",
  ["archive", "--format=zip", `--output=${outputPath}`, "HEAD"],
  { cwd: root, stdio: "inherit" }
)

const archive = await stat(outputPath)
stdout.write(
  `Created ${path.relative(root, outputPath)} (${archive.size.toLocaleString()} bytes).\n`
)
