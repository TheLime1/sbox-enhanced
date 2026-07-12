import type {
  PlasmoCSConfig,
  PlasmoGetInlineAnchor,
  PlasmoGetShadowHostId,
  PlasmoGetStyle
} from "plasmo"
import styleText from "data-text:./sbox-enhanced.css"

import { EnhancedControls } from "../components/enhanced-controls"
import { resolveGameIdentity } from "../lib/game-identity"

export const config: PlasmoCSConfig = {
  matches: ["https://sbox.game/*"],
  run_at: "document_idle"
}

export const getInlineAnchor: PlasmoGetInlineAnchor = () => {
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

export default EnhancedControls
