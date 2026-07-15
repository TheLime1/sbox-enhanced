import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent
} from "react"

import { ChevronIcon, CloseIcon, DownloadIcon, WarningIcon } from "./icons"
import {
  buildStatsFilename,
  buildStatsPayload,
  collectAggregatedRows,
  extractOverviewRows,
  filterAggregatedRows,
  fromLocalDateTimeValue,
  getAggregatedRange,
  getPlayerFilter,
  getStatsResultKey,
  serializeStatsCsv,
  serializeStatsJson,
  toLocalDateTimeValue,
  type CollectionProgress,
  type StatsAggregatedRow,
  type StatsExportRow,
  type StatsRange,
  type StatsRoute
} from "../lib/stats-export"

const PANEL_ID = "sbox-enhanced-export-panel"
const FORMAT_MENU_ID = "sbox-enhanced-export-formats"
const DAY = 24 * 60 * 60 * 1000
const RANGE_STEP = 60 * 1000

const PRESETS = [
  { label: "24 hours", duration: DAY },
  { label: "7 days", duration: 7 * DAY },
  { label: "30 days", duration: 30 * DAY },
  { label: "All", duration: null }
] as const

interface CachedRows {
  key: string
  rows: StatsAggregatedRow[]
  playerFilter: string
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp))
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export function StatsExportControls({ route }: { route: StatsRoute }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [formatMenuOpen, setFormatMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<StatsExportRow[]>([])
  const [playerFilter, setPlayerFilter] = useState("")
  const [rangeBounds, setRangeBounds] = useState<StatsRange | null>(null)
  const [range, setRange] = useState<StatsRange | null>(null)
  const [progress, setProgress] = useState<CollectionProgress | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const panelButtonRef = useRef<HTMLButtonElement>(null)
  const formatButtonRef = useRef<HTMLButtonElement>(null)
  const formatRefs = useRef<Array<HTMLButtonElement | null>>([])
  const abortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<CachedRows | null>(null)

  const setAggregatedRows = useCallback((nextRows: StatsAggregatedRow[]) => {
    const bounds = getAggregatedRange(nextRows)
    setRows(nextRows)
    setRangeBounds(bounds)
    setRange(bounds)
  }, [])

  const loadRows = useCallback(
    async (force = false) => {
      setError("")
      setNotice("")

      if (route.view === "overview") {
        setRows(extractOverviewRows())
        setPlayerFilter("")
        setRangeBounds(null)
        setRange(null)
        return
      }

      if (route.view !== "aggregated") return

      const filter = getPlayerFilter()
      const cacheKey = `${route.aggregatedUrl}|${getStatsResultKey()}`
      const cached = cacheRef.current

      if (!force && cached?.key === cacheKey) {
        setPlayerFilter(cached.playerFilter)
        setAggregatedRows(cached.rows)
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setProgress({ page: 0, totalPages: 1, rows: 0 })

      try {
        const nextRows = await collectAggregatedRows({
          signal: controller.signal,
          onProgress: setProgress
        })

        if (controller.signal.aborted) return

        cacheRef.current = {
          key: cacheKey,
          rows: nextRows,
          playerFilter: filter
        }
        setPlayerFilter(filter)
        setAggregatedRows(nextRows)

        if (nextRows.length === 0) {
          setError("No matching aggregated rows were found.")
        }
      } catch (loadError) {
        if (isAbortError(loadError)) {
          setNotice("Collection cancelled.")
        } else {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "The aggregated stats could not be collected."
          )
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setLoading(false)
          setProgress(null)
        }
      }
    },
    [route.aggregatedUrl, route.view, setAggregatedRows]
  )

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!event.composedPath().includes(containerRef.current as EventTarget)) {
        setFormatMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return

      if (formatMenuOpen) {
        event.preventDefault()
        setFormatMenuOpen(false)
        formatButtonRef.current?.focus()
      } else if (panelOpen) {
        event.preventDefault()
        abortRef.current?.abort()
        setPanelOpen(false)
        panelButtonRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [formatMenuOpen, panelOpen])

  useEffect(() => () => abortRef.current?.abort(), [])

  const selectedRows = useMemo(() => {
    if (route.view !== "aggregated" || !range) return rows
    return filterAggregatedRows(rows as StatsAggregatedRow[], range)
  }, [range, route.view, rows])

  const activePreset = useCallback(
    (duration: number | null) => {
      if (!range || !rangeBounds) return false
      const expectedFrom =
        duration === null
          ? rangeBounds.from
          : Math.max(rangeBounds.from, rangeBounds.to - duration)
      return range.from === expectedFrom && range.to === rangeBounds.to
    },
    [range, rangeBounds]
  )

  const applyPreset = (duration: number | null) => {
    if (!rangeBounds) return
    setRange({
      from:
        duration === null
          ? rangeBounds.from
          : Math.max(rangeBounds.from, rangeBounds.to - duration),
      to: rangeBounds.to
    })
  }

  const updateFrom = (timestamp: number) => {
    if (!range || !rangeBounds) return
    setRange({
      from: Math.min(Math.max(timestamp, rangeBounds.from), range.to),
      to: range.to
    })
  }

  const updateTo = (timestamp: number) => {
    if (!range || !rangeBounds) return
    setRange({
      from: range.from,
      to: Math.max(Math.min(timestamp, rangeBounds.to), range.from)
    })
  }

  const closePanel = () => {
    abortRef.current?.abort()
    setFormatMenuOpen(false)
    setPanelOpen(false)
    panelButtonRef.current?.focus()
  }

  const togglePanel = () => {
    if (panelOpen) {
      closePanel()
      return
    }

    setPanelOpen(true)
    void loadRows()
  }

  const exportRows = (format: "json" | "csv") => {
    if (selectedRows.length === 0) {
      setError("No rows fall inside the selected range.")
      setFormatMenuOpen(false)
      return
    }

    const exportRange = route.view === "aggregated" ? range : null
    const payload = buildStatsPayload({
      route,
      rows: selectedRows,
      playerFilter,
      range: exportRange
    })
    const content =
      format === "json"
        ? serializeStatsJson(payload)
        : serializeStatsCsv(
            selectedRows,
            route.view as "overview" | "aggregated"
          )
    const filename = buildStatsFilename(route, format, exportRange)

    downloadFile(
      content,
      filename,
      format === "json"
        ? "application/json;charset=utf-8"
        : "text/csv;charset=utf-8"
    )
    setFormatMenuOpen(false)
    setError("")
    setNotice(`Downloaded ${selectedRows.length.toLocaleString()} rows as ${format.toUpperCase()}.`)
  }

  const openFormatMenuAt = (index: number) => {
    setFormatMenuOpen(true)
    window.requestAnimationFrame(() => formatRefs.current[index]?.focus())
  }

  const handleFormatButtonKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      openFormatMenuAt(0)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      openFormatMenuAt(1)
    }
  }

  const handleFormatItemKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const direction = event.key === "ArrowDown" ? 1 : -1
      formatRefs.current[(index + direction + 2) % 2]?.focus()
    } else if (event.key === "Home") {
      event.preventDefault()
      formatRefs.current[0]?.focus()
    } else if (event.key === "End") {
      event.preventDefault()
      formatRefs.current[1]?.focus()
    } else if (event.key === "Escape") {
      event.preventDefault()
      setFormatMenuOpen(false)
      formatButtonRef.current?.focus()
    }
  }

  if (route.view === "entries") {
    return (
      <div className="stats-export-root" data-testid="stats-export-controls">
        <a
          className="stats-entry-warning"
          href={route.aggregatedUrl}
          aria-label="Too much data to export for now. Go to Aggregated to export.">
          <WarningIcon className="stats-icon" />
          <span>
            <strong>Too much data to export for now.</strong>
            <small>Go to Aggregated to export.</small>
          </span>
        </a>
      </div>
    )
  }

  const sliderMin = rangeBounds?.from ?? 0
  const sliderMax = Math.max(rangeBounds?.to ?? 0, sliderMin + RANGE_STEP)
  const sliderSpan = sliderMax - sliderMin
  const startPercent = range ? ((range.from - sliderMin) / sliderSpan) * 100 : 0
  const endPercent = range ? ((range.to - sliderMin) / sliderSpan) * 100 : 100
  const selectionStyle = {
    left: `${startPercent}%`,
    width: `${Math.max(0, endPercent - startPercent)}%`
  } satisfies CSSProperties

  return (
    <div
      className="stats-export-root"
      ref={containerRef}
      data-testid="stats-export-controls">
      <div className="stats-export-toolbar">
        <div>
          <strong>{route.view === "overview" ? "Stats overview" : route.stat}</strong>
          <span>
            {route.view === "overview"
              ? "Export every aggregate stat"
              : "Export aggregated players by LastSeen"}
          </span>
        </div>
        <button
          ref={panelButtonRef}
          className="stats-primary-button"
          type="button"
          aria-expanded={panelOpen}
          aria-controls={PANEL_ID}
          onClick={togglePanel}>
          <DownloadIcon className="stats-icon" />
          <span>Export</span>
          <ChevronIcon
            className={`stats-chevron${panelOpen ? " is-open" : ""}`}
          />
        </button>
      </div>

      {panelOpen && (
        <section
          className="stats-export-panel"
          id={PANEL_ID}
          aria-label="Stats export options">
          <header className="stats-panel-header">
            <div>
              <h2>Export {route.stat ?? "stats overview"}</h2>
              <p>
                {route.view === "overview"
                  ? "All overview rows will be included."
                  : "The range filters players by LastSeen. Totals are unchanged."}
              </p>
            </div>
            <button
              className="stats-icon-button"
              type="button"
              aria-label="Close export options"
              onClick={closePanel}>
              <CloseIcon className="stats-icon" />
            </button>
          </header>

          {loading && progress && (
            <div className="stats-progress" aria-live="polite">
              <div>
                <span>
                  Collecting page {Math.max(1, progress.page)} of {progress.totalPages}
                </span>
                <strong>{progress.rows.toLocaleString()} rows</strong>
              </div>
              <progress
                max={Math.max(1, progress.totalPages)}
                value={progress.page}
                aria-label="Aggregated stats collection progress"
              />
              <button
                className="stats-secondary-button"
                type="button"
                onClick={() => abortRef.current?.abort()}>
                Cancel
              </button>
            </div>
          )}

          {!loading && route.view === "aggregated" && range && rangeBounds && (
            <fieldset className="stats-range-fieldset">
              <legend>LastSeen range</legend>
              <div className="stats-presets" aria-label="Date range presets">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={activePreset(preset.duration)}
                    onClick={() => applyPreset(preset.duration)}>
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="stats-range-summary" aria-live="polite">
                <span>{formatDate(range.from)}</span>
                <span aria-hidden="true">to</span>
                <span>{formatDate(range.to)}</span>
              </div>

              <div className="stats-dual-range">
                <div className="stats-range-track" aria-hidden="true">
                  <span style={selectionStyle} />
                </div>
                <input
                  className="stats-range-input stats-range-from"
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={RANGE_STEP}
                  value={range.from}
                  aria-label="LastSeen range start"
                  aria-valuetext={formatDate(range.from)}
                  onChange={(event) => updateFrom(Number(event.currentTarget.value))}
                />
                <input
                  className="stats-range-input stats-range-to"
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={RANGE_STEP}
                  value={range.to}
                  aria-label="LastSeen range end"
                  aria-valuetext={formatDate(range.to)}
                  onChange={(event) => updateTo(Number(event.currentTarget.value))}
                />
              </div>

              <div className="stats-date-inputs">
                <label>
                  <span>From</span>
                  <input
                    type="datetime-local"
                    value={toLocalDateTimeValue(range.from)}
                    min={toLocalDateTimeValue(rangeBounds.from)}
                    max={toLocalDateTimeValue(range.to)}
                    onChange={(event) => {
                      const timestamp = fromLocalDateTimeValue(event.currentTarget.value)
                      if (timestamp !== null) updateFrom(timestamp)
                    }}
                  />
                </label>
                <label>
                  <span>To</span>
                  <input
                    type="datetime-local"
                    value={toLocalDateTimeValue(range.to)}
                    min={toLocalDateTimeValue(range.from)}
                    max={toLocalDateTimeValue(rangeBounds.to)}
                    onChange={(event) => {
                      const timestamp = fromLocalDateTimeValue(event.currentTarget.value)
                      if (timestamp !== null) updateTo(timestamp)
                    }}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {error && (
            <div className="stats-message is-error" role="alert">
              <WarningIcon className="stats-icon" />
              <span>{error}</span>
              {!loading && route.view === "aggregated" && (
                <button type="button" onClick={() => void loadRows(true)}>
                  Retry
                </button>
              )}
            </div>
          )}

          {notice && (
            <div className="stats-message is-success" aria-live="polite">
              {notice}
            </div>
          )}

          {!loading && rows.length > 0 && (
            <footer className="stats-panel-footer">
              <span>
                <strong>{selectedRows.length.toLocaleString()}</strong> of{" "}
                {rows.length.toLocaleString()} rows
              </span>
              <div className="stats-format-control">
                <button
                  ref={formatButtonRef}
                  className="stats-primary-button"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={formatMenuOpen}
                  aria-controls={FORMAT_MENU_ID}
                  onClick={() => setFormatMenuOpen((open) => !open)}
                  onKeyDown={handleFormatButtonKeyDown}>
                  <DownloadIcon className="stats-icon" />
                  <span>Export {selectedRows.length.toLocaleString()} rows</span>
                  <ChevronIcon
                    className={`stats-chevron${formatMenuOpen ? " is-open" : ""}`}
                  />
                </button>
                {formatMenuOpen && (
                  <div
                    className="stats-format-menu"
                    id={FORMAT_MENU_ID}
                    role="menu">
                    {(["json", "csv"] as const).map((format, index) => (
                      <button
                        key={format}
                        ref={(element) => {
                          formatRefs.current[index] = element
                        }}
                        type="button"
                        role="menuitem"
                        onClick={() => exportRows(format)}
                        onKeyDown={(event) =>
                          handleFormatItemKeyDown(event, index)
                        }>
                        <strong>{format.toUpperCase()}</strong>
                        <span>
                          {format === "json"
                            ? "Structured data with export metadata"
                            : "Spreadsheet-friendly table"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </footer>
          )}
        </section>
      )}
    </div>
  )
}
