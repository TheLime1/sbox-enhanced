import {
  buildStatsFilename,
  buildStatsPayload,
  collectAggregatedRows,
  extractAggregatedRows,
  extractOverviewRows,
  filterAggregatedRows,
  fromLocalDateTimeValue,
  getAggregatedRange,
  normalizeStatValue,
  parseSboxUtcTimestamp,
  parseStatsRoute,
  serializeStatsCsv,
  serializeStatsJson,
  toLocalDateTimeValue,
  type StatsAggregatedRow
} from "../lib/stats-export"

const CASH_URL = "https://sbox.game/limestudio/auto_bricks/service/stats/cash"

function aggregatedRow(
  name: string,
  timestamp = "Wednesday, July 15, 2026 12:19:33 PM",
  value = "5,228,458.20"
) {
  return `
    <tr>
      <td><input type="checkbox"></td>
      <td><span class="time" title="${timestamp}">Today</span></td>
      <td><a href="/u/${name}">${name}</a></td>
      <td>${value}</td>
      <td>0.00</td>
      <td>${value}</td>
    </tr>
  `
}

function renderAggregatedPage(page: number, totalPages: number) {
  const table = document.querySelector<HTMLTableElement>("table.datagrid")!
  table.querySelector("tbody")!.innerHTML = aggregatedRow(`player-${page}`)
  const footer = table.querySelector("tfoot")!
  footer.innerHTML = `
    <tr><td>
      <a class="${page === 1 ? "disabled" : ""}"><span>arrow_back_ios</span></a>
      ${Array.from({ length: totalPages }, (_, index) => {
        const number = index + 1
        return `<a class="${number === page ? "active" : ""}">${number}</a>`
      }).join("")}
      <a class="${page === totalPages ? "disabled" : ""}"><span>arrow_forward_ios</span></a>
    </td></tr>
  `

  Array.from(footer.querySelectorAll<HTMLAnchorElement>("a")).forEach((link) => {
    const value = link.textContent?.trim() ?? ""
    const numeric = Number.parseInt(value, 10)
    const target = value.includes("forward")
      ? page + 1
      : value.includes("back")
        ? page - 1
        : numeric

    if (target >= 1 && target <= totalPages && target !== page) {
      link.addEventListener("click", () => renderAggregatedPage(target, totalPages))
    }
  })
}

describe("stats routes", () => {
  it.each([
    ["https://sbox.game/limestudio/auto_bricks/service/stats", "overview"],
    [CASH_URL, "aggregated"],
    [`${CASH_URL}?tab=Entries`, "entries"]
  ] as const)("detects %s as %s", (url, view) => {
    expect(parseStatsRoute(url)).toMatchObject({
      organization: "limestudio",
      game: "auto_bricks",
      stat: view === "overview" ? null : "cash",
      view
    })
  })

  it.each([
    "https://example.com/limestudio/auto_bricks/service/stats",
    "http://sbox.game/limestudio/auto_bricks/service/stats",
    "https://sbox.game/limestudio/auto_bricks",
    "https://sbox.game/limestudio/auto_bricks/service/stats/cash/extra"
  ])("rejects unrelated routes: %s", (url) => {
    expect(parseStatsRoute(url)).toBeNull()
  })

  it("builds an Aggregated return URL without the Entries query", () => {
    expect(parseStatsRoute(`${CASH_URL}?tab=Entries`)?.aggregatedUrl).toBe(CASH_URL)
  })
})

describe("stats table extraction", () => {
  it("extracts overview links and preserves large values as strings", () => {
    document.body.innerHTML = `
      <table class="datagrid"><tbody><tr>
        <td><a href="/limestudio/auto_bricks/service/stats/cash">cash</a></td>
        <td>265</td><td>0.00</td><td>0.00</td>
        <td>270,477,328,438,083,000,000,000,000,000,000.00</td>
        <td>0.00</td><td>0.00</td>
      </tr></tbody></table>
    `

    expect(extractOverviewRows(document, CASH_URL)).toEqual([
      {
        Name: "cash",
        StatUrl: CASH_URL,
        Players: "265",
        Min: "0.00",
        Max: "0.00",
        Sum: "270477328438083000000000000000000.00",
        Avg: "0.00",
        Value: "0.00"
      }
    ])
  })

  it("extracts UTC dates, player links, and aggregated values", () => {
    document.body.innerHTML = `
      <table class="datagrid"><tbody>${aggregatedRow("Señor-Vac")}</tbody></table>
    `

    expect(extractAggregatedRows(document, CASH_URL)).toEqual([
      {
        LastSeen: "2026-07-15T12:19:33.000Z",
        LastSeenLabel: "Today",
        SteamId: "Señor-Vac",
        ProfileUrl: "https://sbox.game/u/Se%C3%B1or-Vac",
        ValueSum: "5228458.20",
        ValueMin: "0.00",
        ValueMax: "5228458.20"
      }
    ])
  })

  it("normalizes only numeric table values", () => {
    expect(normalizeStatValue("1,234,567.89")).toBe("1234567.89")
    expect(normalizeStatValue("Player, One")).toBe("Player, One")
  })
})

describe("aggregated pagination", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input name="FilterText" value="player">
      <table class="datagrid"><tbody></tbody><tfoot></tfoot></table>
    `
  })

  it("collects every page and restores the original active page", async () => {
    renderAggregatedPage(2, 3)
    const progress = vi.fn()

    const rows = await collectAggregatedRows({ root: document, onProgress: progress })

    expect(rows.map((row) => row.SteamId)).toEqual([
      "player-1",
      "player-2",
      "player-3"
    ])
    expect(document.querySelector("tfoot a.active")).toHaveTextContent("2")
    expect(progress).toHaveBeenLastCalledWith({ page: 3, totalPages: 3, rows: 3 })
    expect(
      document.querySelector<HTMLInputElement>('input[name="FilterText"]')?.value
    ).toBe("player")
  })

  it("supports cancellation before collection starts", async () => {
    renderAggregatedPage(1, 3)
    const controller = new AbortController()
    controller.abort()

    await expect(
      collectAggregatedRows({ root: document, signal: controller.signal })
    ).rejects.toMatchObject({ name: "AbortError" })
  })

  it("reports a stalled pagination update", async () => {
    renderAggregatedPage(1, 2)
    const forward = Array.from(document.querySelectorAll("tfoot a")).find((link) =>
      link.textContent?.includes("forward")
    )!
    forward.replaceWith(forward.cloneNode(true))

    await expect(
      collectAggregatedRows({ root: document, timeoutMs: 10 })
    ).rejects.toThrow("Stats page 2 did not load")
  })
})

describe("range and serialization", () => {
  const rows: StatsAggregatedRow[] = [
    {
      LastSeen: "2026-07-15T12:00:00.000Z",
      LastSeenLabel: "Today",
      SteamId: "Señor Vac",
      ProfileUrl: "https://sbox.game/u/player",
      ValueSum: "999999999999999999999999.00",
      ValueMin: "0.00",
      ValueMax: "999999999999999999999999.00"
    },
    {
      LastSeen: "2026-07-10T12:00:00.000Z",
      LastSeenLabel: "5 Days Ago",
      SteamId: "Older",
      ProfileUrl: "https://sbox.game/u/older",
      ValueSum: "2.00",
      ValueMin: "1.00",
      ValueMax: "2.00"
    }
  ]

  it("uses inclusive timestamps and local input round-tripping", () => {
    const range = getAggregatedRange(rows, Date.parse("2026-07-15T13:00:00.000Z"))!
    expect(filterAggregatedRows(rows, { from: range.from, to: range.from })).toEqual([
      rows[1]
    ])

    const minute = Date.parse("2026-07-15T12:20:00.000Z")
    expect(fromLocalDateTimeValue(toLocalDateTimeValue(minute))).toBe(minute)
  })

  it("parses sbox timestamps explicitly as UTC", () => {
    expect(parseSboxUtcTimestamp("Wednesday, July 15, 2026 12:19:33 PM")).toBe(
      "2026-07-15T12:19:33.000Z"
    )
    expect(parseSboxUtcTimestamp("not a timestamp")).toBeNull()
  })

  it("serializes JSON metadata and spreadsheet-safe UTF-8 CSV", () => {
    const route = parseStatsRoute(CASH_URL)!
    const range = {
      from: Date.parse("2026-07-10T00:00:00.000Z"),
      to: Date.parse("2026-07-15T00:00:00.000Z")
    }
    const payload = buildStatsPayload({
      route,
      rows,
      playerFilter: "Señor",
      range,
      exportedAt: "2026-07-15T14:00:00.000Z"
    })
    const json = serializeStatsJson(payload)
    const csv = serializeStatsCsv(rows, "aggregated")

    expect(JSON.parse(json)).toMatchObject({
      schemaVersion: 1,
      stat: "cash",
      rowCount: 2,
      filters: { player: "Señor" }
    })
    expect(json).toContain('"999999999999999999999999.00"')
    expect(csv.startsWith("\uFEFF")).toBe(true)
    expect(csv).toContain('"Señor Vac"')
    expect(csv).toContain('"999999999999999999999999.00"')
    expect(csv.endsWith("\r\n")).toBe(true)
  })

  it("creates descriptive filenames", () => {
    const route = parseStatsRoute(CASH_URL)!
    expect(
      buildStatsFilename(
        route,
        "json",
        {
          from: Date.parse("2026-07-10T00:00:00.000Z"),
          to: Date.parse("2026-07-15T00:00:00.000Z")
        },
        "2026-07-15T14:00:00.000Z"
      )
    ).toBe(
      "sbox-limestudio-auto_bricks-stats-cash-aggregated-2026-07-10_to_2026-07-15.json"
    )
  })
})
