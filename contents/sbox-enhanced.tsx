import { useEffect, useState } from "react"
import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchor,
  PlasmoGetShadowHostId,
  PlasmoGetStyle
} from "plasmo"
import styleText from "data-text:./sbox-enhanced.css"

import { EnhancedControls } from "../components/enhanced-controls"
import { StatsExportControls } from "../components/stats-export-controls"
import { resolveGameIdentity } from "../lib/game-identity"
import { parseStatsRoute, type StatsRoute } from "../lib/stats-export"

export const config: PlasmoCSConfig = {
  matches: ["https://sbox.game/*"],
  run_at: "document_idle"
}

export const getInlineAnchor: PlasmoGetInlineAnchor = () => {
  const statsRoute = parseStatsRoute(window.location.href)

  if (statsRoute) {
    const table = document.querySelector<HTMLTableElement>("table.datagrid")
    if (!table?.parentElement) return null

    return {
      element: table.parentElement,
      insertPosition: "afterbegin"
    }
  }

  if (!resolveGameIdentity(window.location.href, document)) return null

  const headerButtons = document.querySelector(".package-header-buttons")
  if (!headerButtons) return null

  return {
    element: headerButtons,
    insertPosition: "afterend"
  }
}

export const getShadowHostId: PlasmoGetShadowHostId = () =>
  "sbox-enhanced-controls"

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

function useCurrentStatsRoute(): StatsRoute | null {
  const [route, setRoute] = useState(() => parseStatsRoute(window.location.href))

  useEffect(() => {
    let previousHref = window.location.href

    const refresh = () => {
      const currentHref = window.location.href
      if (currentHref === previousHref) return

      previousHref = currentHref
      setRoute(parseStatsRoute(currentHref))
    }
    const observer = new MutationObserver(refresh)
    const interval = window.setInterval(refresh, 500)

    observer.observe(document.documentElement, { childList: true, subtree: true })
    window.addEventListener("popstate", refresh)

    return () => {
      observer.disconnect()
      window.clearInterval(interval)
      window.removeEventListener("popstate", refresh)
    }
  }, [])

  return route
}

function SboxEnhanced() {
  const statsRoute = useCurrentStatsRoute()

  return statsRoute ? (
    <StatsExportControls key={statsRoute.sourceUrl} route={statsRoute} />
  ) : (
    <EnhancedControls />
  )
}

export default SboxEnhanced
