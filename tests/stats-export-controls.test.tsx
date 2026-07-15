import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { StatsExportControls } from "../components/stats-export-controls"
import { parseStatsRoute } from "../lib/stats-export"

const OVERVIEW_URL = "https://sbox.game/limestudio/auto_bricks/service/stats"
const CASH_URL = `${OVERVIEW_URL}/cash`

function setOverviewTable() {
  document.body.innerHTML = `
    <table class="datagrid"><tbody><tr>
      <td><a href="/limestudio/auto_bricks/service/stats/cash">cash</a></td>
      <td>265</td><td>0.00</td><td>0.00</td><td>123.00</td><td>0.00</td><td>0.00</td>
    </tr></tbody></table>
  `
}

function setAggregatedTable() {
  document.body.innerHTML = `
    <input name="FilterText" value="player">
    <table class="datagrid"><tbody>
      <tr>
        <td><input type="checkbox"></td>
        <td><span class="time" title="Wednesday, July 15, 2026 12:00:00 PM">Today</span></td>
        <td><a href="/u/newer">Newer</a></td>
        <td>5,000.00</td><td>0.00</td><td>5,000.00</td>
      </tr>
      <tr>
        <td><input type="checkbox"></td>
        <td><span class="time" title="Monday, July 13, 2026 12:00:00 PM">2 Days Ago</span></td>
        <td><a href="/u/older">Older</a></td>
        <td>2,000.00</td><td>0.00</td><td>2,000.00</td>
      </tr>
    </tbody></table>
  `
}

describe("StatsExportControls", () => {
  let createObjectUrl: ReturnType<typeof vi.fn>
  let revokeObjectUrl: ReturnType<typeof vi.fn>
  let anchorClick: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectUrl = vi.fn(() => "blob:stats-export")
    revokeObjectUrl = vi.fn()
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrl
    })
    anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    anchorClick.mockRestore()
    vi.restoreAllMocks()
  })

  it("exports the overview through a keyboard-accessible format menu", async () => {
    setOverviewTable()
    const route = parseStatsRoute(OVERVIEW_URL)!
    render(<StatsExportControls route={route} />)

    const panelButton = screen.getByRole("button", { name: "Export" })
    fireEvent.click(panelButton)

    expect(
      await screen.findByRole("heading", { name: "Export stats overview" })
    ).toBeInTheDocument()

    const formatButton = screen.getByRole("button", { name: "Export 1 rows" })
    fireEvent.keyDown(formatButton, { key: "ArrowDown" })

    const jsonButton = await screen.findByRole("menuitem", { name: /JSON/ })
    await waitFor(() => expect(jsonButton).toHaveFocus())
    fireEvent.click(jsonButton)

    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(anchorClick).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Downloaded 1 rows as JSON.")).toBeInTheDocument()
  })

  it("applies rolling LastSeen presets to aggregated rows", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-07-15T13:00:00.000Z"))
    setAggregatedTable()
    const route = parseStatsRoute(CASH_URL)!
    render(<StatsExportControls route={route} />)

    fireEvent.click(screen.getByRole("button", { name: "Export" }))

    expect(
      await screen.findByRole("group", { name: "LastSeen range" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Export 2 rows" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "24 hours" }))

    expect(screen.getByRole("button", { name: "24 hours" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "Export 1 rows" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "LastSeen range start" })).toHaveAttribute(
      "aria-valuetext"
    )
  })

  it("restores focus as the format menu and panel close with Escape", async () => {
    setOverviewTable()
    render(<StatsExportControls route={parseStatsRoute(OVERVIEW_URL)!} />)

    const panelButton = screen.getByRole("button", { name: "Export" })
    fireEvent.click(panelButton)
    const formatButton = await screen.findByRole("button", { name: "Export 1 rows" })
    fireEvent.keyDown(formatButton, { key: "ArrowDown" })
    await screen.findByRole("menu")

    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() => expect(formatButton).toHaveFocus())

    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() => expect(panelButton).toHaveFocus())
    expect(screen.queryByRole("heading", { name: /Export/ })).not.toBeInTheDocument()
  })

  it("replaces raw Entries export with a direct Aggregated action", () => {
    const route = parseStatsRoute(`${CASH_URL}?tab=Entries`)!
    render(<StatsExportControls route={route} />)

    expect(
      screen.getByRole("link", {
        name: "Too much data to export for now. Go to Aggregated to export."
      })
    ).toHaveAttribute("href", CASH_URL)
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument()
  })
})
