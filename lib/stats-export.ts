export type StatsView = "overview" | "aggregated" | "entries"

export interface StatsRoute {
  organization: string
  game: string
  stat: string | null
  view: StatsView
  sourceUrl: string
  aggregatedUrl: string
}

export interface StatsOverviewRow {
  Name: string
  StatUrl: string
  Players: string
  Min: string
  Max: string
  Sum: string
  Avg: string
  Value: string
}

export interface StatsAggregatedRow {
  LastSeen: string
  LastSeenLabel: string
  SteamId: string
  ProfileUrl: string
  ValueSum: string
  ValueMin: string
  ValueMax: string
}

export type StatsExportRow = StatsOverviewRow | StatsAggregatedRow

export interface StatsRange {
  from: number
  to: number
}

export interface StatsExportPayload {
  schemaVersion: 1
  sourceUrl: string
  exportedAt: string
  organization: string
  game: string
  stat: string | null
  view: "overview" | "aggregated"
  filters: {
    player: string
    from: string | null
    to: string | null
  }
  rowCount: number
  rows: StatsExportRow[]
}

export interface CollectionProgress {
  page: number
  totalPages: number
  rows: number
}

interface CollectAggregatedOptions {
  root?: Document
  signal?: AbortSignal
  timeoutMs?: number
  onProgress?: (progress: CollectionProgress) => void
}

const VALID_SEGMENT = /^[a-z0-9][a-z0-9_-]*$/i
const NUMBER_TEXT = /^-?[\d,]+(?:\.\d+)?$/
const PAGE_NUMBER = /^\d[\d,]*$/

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

function absoluteUrl(href: string | null, baseUrl: string): string {
  if (!href) return ""

  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return ""
  }
}

function text(element: Element | null | undefined): string {
  return element?.textContent?.trim() ?? ""
}

export function normalizeStatValue(value: string): string {
  const trimmed = value.trim()
  return NUMBER_TEXT.test(trimmed) ? trimmed.replaceAll(",", "") : trimmed
}

export function parseStatsRoute(input: URL | string): StatsRoute | null {
  let url: URL

  try {
    url = typeof input === "string" ? new URL(input) : new URL(input.toString())
  } catch {
    return null
  }

  if (url.protocol !== "https:" || url.hostname !== "sbox.game") return null

  const segments = url.pathname.split("/").filter(Boolean)
  if (segments.length !== 4 && segments.length !== 5) return null

  const organization = safeDecode(segments[0])
  const game = safeDecode(segments[1])
  const stat = segments[4] ? safeDecode(segments[4]) : null

  if (
    !organization ||
    !game ||
    !VALID_SEGMENT.test(organization) ||
    !VALID_SEGMENT.test(game) ||
    segments[2] !== "service" ||
    segments[3] !== "stats" ||
    (stat !== null && !VALID_SEGMENT.test(stat))
  ) {
    return null
  }

  const view: StatsView = !stat
    ? "overview"
    : url.searchParams.get("tab")?.toLowerCase() === "entries"
      ? "entries"
      : "aggregated"
  const aggregatedUrl = new URL(url)
  aggregatedUrl.searchParams.delete("tab")

  return {
    organization,
    game,
    stat,
    view,
    sourceUrl: url.toString(),
    aggregatedUrl: aggregatedUrl.toString()
  }
}

export function parseSboxUtcTimestamp(value: string): string | null {
  const timestamp = Date.parse(`${value.trim()} UTC`)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

export function toLocalDateTimeValue(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number) => value.toString().padStart(2, "0")

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes())
  ].join("")
}

export function fromLocalDateTimeValue(value: string): number | null {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

function getStatsTable(root: Document): HTMLTableElement | null {
  return root.querySelector<HTMLTableElement>("table.datagrid")
}

export function getPlayerFilter(root: Document = document): string {
  return (
    root.querySelector<HTMLInputElement>('input[name="FilterText"]')?.value.trim() ??
    ""
  )
}

export function getStatsResultKey(root: Document = document): string {
  const table = getStatsTable(root)
  const footer = text(table?.querySelector("tfoot"))
  const resultCount = footer.match(/([\d.,]+k?)\s+Results/i)?.[1] ?? ""
  const sorted = Array.from(table?.querySelectorAll("thead .sorted") ?? [])
    .map((cell) => `${text(cell)}:${cell.className}`)
    .join("|")

  return `${getPlayerFilter(root)}|${resultCount}|${sorted}`
}

export function extractOverviewRows(
  root: Document = document,
  baseUrl = root.location?.href ?? "https://sbox.game/"
): StatsOverviewRow[] {
  const table = getStatsTable(root)
  if (!table) return []

  return Array.from(table.querySelectorAll("tbody tr")).flatMap((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    if (cells.length < 7) return []

    const statLink = cells[0].querySelector<HTMLAnchorElement>("a")

    return [
      {
        Name: text(statLink ?? cells[0]),
        StatUrl: absoluteUrl(statLink?.getAttribute("href") ?? null, baseUrl),
        Players: normalizeStatValue(text(cells[1])),
        Min: normalizeStatValue(text(cells[2])),
        Max: normalizeStatValue(text(cells[3])),
        Sum: normalizeStatValue(text(cells[4])),
        Avg: normalizeStatValue(text(cells[5])),
        Value: normalizeStatValue(text(cells[6]))
      }
    ]
  })
}

export function extractAggregatedRows(
  root: Document = document,
  baseUrl = root.location?.href ?? "https://sbox.game/"
): StatsAggregatedRow[] {
  const table = getStatsTable(root)
  if (!table) return []

  return Array.from(table.querySelectorAll("tbody tr")).flatMap((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    if (cells.length < 6) return []

    const time = cells[1].querySelector<HTMLElement>(".time")
    const profile = cells[2].querySelector<HTMLAnchorElement>("a")
    const lastSeenTitle = time?.getAttribute("title") ?? ""
    const lastSeen = parseSboxUtcTimestamp(lastSeenTitle)
    if (!lastSeen) return []

    return [
      {
        LastSeen: lastSeen,
        LastSeenLabel: text(time ?? cells[1]),
        SteamId: text(profile ?? cells[2]),
        ProfileUrl: absoluteUrl(profile?.getAttribute("href") ?? null, baseUrl),
        ValueSum: normalizeStatValue(text(cells[3])),
        ValueMin: normalizeStatValue(text(cells[4])),
        ValueMax: normalizeStatValue(text(cells[5]))
      }
    ]
  })
}

export function getAggregatedRange(
  rows: StatsAggregatedRow[],
  now = Date.now()
): StatsRange | null {
  const timestamps = rows
    .map((row) => Date.parse(row.LastSeen))
    .filter(Number.isFinite)

  if (timestamps.length === 0) return null

  return {
    from: Math.min(...timestamps),
    to: Math.max(now, ...timestamps)
  }
}

export function filterAggregatedRows(
  rows: StatsAggregatedRow[],
  range: StatsRange
): StatsAggregatedRow[] {
  return rows.filter((row) => {
    const timestamp = Date.parse(row.LastSeen)
    return timestamp >= range.from && timestamp <= range.to
  })
}

function parsePageNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!PAGE_NUMBER.test(trimmed)) return null
  return Number.parseInt(trimmed.replaceAll(",", ""), 10)
}

function getActivePage(root: Document): number {
  return parsePageNumber(text(getStatsTable(root)?.querySelector("tfoot a.active"))) ?? 1
}

function getTotalPages(root: Document): number {
  const pages = Array.from(
    getStatsTable(root)?.querySelectorAll("tfoot a") ?? []
  ).flatMap((link) => {
    const page = parsePageNumber(text(link))
    return page === null ? [] : [page]
  })

  return pages.length > 0 ? Math.max(...pages) : 1
}

function getPageLink(root: Document, page: number): HTMLAnchorElement | null {
  return (
    Array.from(
      getStatsTable(root)?.querySelectorAll<HTMLAnchorElement>("tfoot a") ?? []
    ).find((link) => parsePageNumber(text(link)) === page) ?? null
  )
}

function getPagerLink(
  root: Document,
  direction: "back" | "forward"
): HTMLAnchorElement | null {
  const icon = direction === "forward" ? "arrow_forward_ios" : "arrow_back_ios"
  return (
    Array.from(
      getStatsTable(root)?.querySelectorAll<HTMLAnchorElement>("tfoot a") ?? []
    ).find((link) => text(link).includes(icon)) ?? null
  )
}

function abortError(): DOMException {
  return new DOMException("Export cancelled", "AbortError")
}

function waitForPage(
  root: Document,
  page: number,
  signal: AbortSignal | undefined,
  timeoutMs: number
): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError())
  if (getActivePage(root) === page) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const table = getStatsTable(root)
    const target = table?.parentElement ?? root.documentElement
    let settled = false

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      observer.disconnect()
      window.clearTimeout(timeout)
      signal?.removeEventListener("abort", handleAbort)
      if (error) reject(error)
      else resolve()
    }
    const check = () => {
      if (getActivePage(root) === page) finish()
    }
    const handleAbort = () => finish(abortError())
    const observer = new MutationObserver(check)
    const timeout = window.setTimeout(
      () => finish(new Error(`Stats page ${page} did not load. Try again.`)),
      timeoutMs
    )

    observer.observe(target, { childList: true, subtree: true, attributes: true })
    signal?.addEventListener("abort", handleAbort, { once: true })
    check()
  })
}

async function navigateToPage(
  root: Document,
  page: number,
  signal: AbortSignal | undefined,
  timeoutMs: number
): Promise<void> {
  if (getActivePage(root) === page) return

  const directLink = getPageLink(root, page)
  if (directLink) {
    directLink.click()
    await waitForPage(root, page, signal, timeoutMs)
    return
  }

  while (getActivePage(root) !== page) {
    if (signal?.aborted) throw abortError()

    const activePage = getActivePage(root)
    const direction = page > activePage ? "forward" : "back"
    const pager = getPagerLink(root, direction)

    if (!pager || pager.classList.contains("disabled")) {
      throw new Error(`Could not return to stats page ${page}.`)
    }

    const nextPage = activePage + (direction === "forward" ? 1 : -1)
    pager.click()
    await waitForPage(root, nextPage, signal, timeoutMs)
  }
}

export async function collectAggregatedRows({
  root = document,
  signal,
  timeoutMs = 8000,
  onProgress
}: CollectAggregatedOptions = {}): Promise<StatsAggregatedRow[]> {
  if (!getStatsTable(root)) throw new Error("The stats table is unavailable.")

  const originalPage = getActivePage(root)
  const rows: StatsAggregatedRow[] = []
  let collectionFailed = false
  let collectionError: unknown

  try {
    await navigateToPage(root, 1, signal, timeoutMs)
    const totalPages = getTotalPages(root)

    for (let page = 1; page <= totalPages; page += 1) {
      if (signal?.aborted) throw abortError()

      rows.push(...extractAggregatedRows(root))
      onProgress?.({ page, totalPages, rows: rows.length })

      if (page < totalPages) {
        const next = getPagerLink(root, "forward")
        if (!next || next.classList.contains("disabled")) {
          throw new Error(`Stats pagination stopped at page ${page}.`)
        }

        next.click()
        await waitForPage(root, page + 1, signal, timeoutMs)
      }
    }

  } catch (error) {
    collectionFailed = true
    collectionError = error
  }

  let restoreFailed = false
  let restoreError: unknown

  if (getActivePage(root) !== originalPage) {
    try {
      await navigateToPage(root, originalPage, undefined, timeoutMs)
    } catch (error) {
      restoreFailed = true
      restoreError = error
    }
  }

  if (collectionFailed) throw collectionError
  if (restoreFailed) throw restoreError
  return rows
}

export function buildStatsPayload({
  route,
  rows,
  playerFilter = "",
  range = null,
  exportedAt = new Date().toISOString()
}: {
  route: StatsRoute
  rows: StatsExportRow[]
  playerFilter?: string
  range?: StatsRange | null
  exportedAt?: string
}): StatsExportPayload {
  if (route.view === "entries") {
    throw new Error("Entries cannot be exported.")
  }

  return {
    schemaVersion: 1,
    sourceUrl: route.sourceUrl,
    exportedAt,
    organization: route.organization,
    game: route.game,
    stat: route.stat,
    view: route.view,
    filters: {
      player: playerFilter,
      from: range ? new Date(range.from).toISOString() : null,
      to: range ? new Date(range.to).toISOString() : null
    },
    rowCount: rows.length,
    rows
  }
}

export function serializeStatsJson(payload: StatsExportPayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`
}

export function serializeStatsCsv(
  rows: StatsExportRow[],
  view: "overview" | "aggregated"
): string {
  const headers =
    view === "overview"
      ? ["Name", "StatUrl", "Players", "Min", "Max", "Sum", "Avg", "Value"]
      : [
          "LastSeen",
          "LastSeenLabel",
          "SteamId",
          "ProfileUrl",
          "ValueSum",
          "ValueMin",
          "ValueMax"
        ]
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      headers
        .map((header) => escapeCsv(String(row[header as keyof typeof row] ?? "")))
        .join(",")
    )
  ]

  return `\uFEFF${lines.join("\r\n")}\r\n`
}

function filenamePart(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "")
}

export function buildStatsFilename(
  route: StatsRoute,
  extension: "json" | "csv",
  range: StatsRange | null = null,
  exportedAt = new Date().toISOString()
): string {
  const target = route.stat ?? "overview"
  const datePart = range
    ? `${new Date(range.from).toISOString().slice(0, 10)}_to_${new Date(range.to)
        .toISOString()
        .slice(0, 10)}`
    : exportedAt.slice(0, 10)

  return [
    "sbox",
    route.organization,
    route.game,
    "stats",
    target,
    route.view,
    datePart
  ]
    .map(filenamePart)
    .filter(Boolean)
    .join("-")
    .concat(`.${extension}`)
}
