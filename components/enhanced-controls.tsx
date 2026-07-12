import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react"

import { ChevronIcon, PlayIcon, TrackingIcon } from "./icons"
import {
  resolveGameIdentity,
  type GameIdentity
} from "../lib/game-identity"
import { buildSteamLaunchUrl } from "../lib/links"
import { buildTrackerUrl, TRACKERS } from "../lib/trackers"

const TRACKER_MENU_ID = "sbox-enhanced-tracker-menu"

function getCurrentGame(): GameIdentity | null {
  return resolveGameIdentity(window.location.href, document)
}

function useCurrentGame(): GameIdentity | null {
  const [game, setGame] = useState<GameIdentity | null>(getCurrentGame)

  useEffect(() => {
    let previousHref = window.location.href

    const refresh = () => {
      const currentHref = window.location.href
      const nextGame = getCurrentGame()

      setGame((currentGame) => {
        if (
          currentHref === previousHref &&
          currentGame?.ident === nextGame?.ident
        ) {
          return currentGame
        }

        previousHref = currentHref
        return nextGame
      })
    }

    const observer = new MutationObserver(refresh)
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    })

    const interval = window.setInterval(() => {
      if (window.location.href !== previousHref) refresh()
    }, 500)

    window.addEventListener("popstate", refresh)

    return () => {
      observer.disconnect()
      window.clearInterval(interval)
      window.removeEventListener("popstate", refresh)
    }
  }, [])

  return game
}

export function EnhancedControls() {
  const game = useCurrentGame()

  if (!game) return null

  return <GameControls key={game.ident} game={game} />
}

function GameControls({ game }: { game: GameIdentity }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackButtonRef = useRef<HTMLButtonElement>(null)
  const trackerRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const pendingFocusRef = useRef<number | null>(null)

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false)
    pendingFocusRef.current = null
    if (restoreFocus) trackButtonRef.current?.focus()
  }

  const openMenuAt = (index: number) => {
    pendingFocusRef.current = index
    setMenuOpen(true)
  }

  useEffect(() => {
    if (!menuOpen || pendingFocusRef.current === null) return
    trackerRefs.current[pendingFocusRef.current]?.focus()
    pendingFocusRef.current = null
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.composedPath().includes(containerRef.current as EventTarget)) {
        closeMenu()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeMenu(true)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  const handleTrackButtonKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      openMenuAt(0)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      openMenuAt(TRACKERS.length - 1)
    }
  }

  const handleTrackerKeyDown = (
    event: ReactKeyboardEvent<HTMLAnchorElement>,
    index: number
  ) => {
    let nextIndex: number | null = null

    if (event.key === "ArrowDown") {
      nextIndex = (index + 1) % TRACKERS.length
    } else if (event.key === "ArrowUp") {
      nextIndex = (index - 1 + TRACKERS.length) % TRACKERS.length
    } else if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = TRACKERS.length - 1
    } else if (event.key === "Escape") {
      event.preventDefault()
      closeMenu(true)
      return
    }

    if (nextIndex !== null) {
      event.preventDefault()
      trackerRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className="enhanced-controls" ref={containerRef} data-testid="controls">
      <a
        className="enhanced-action enhanced-play"
        href={buildSteamLaunchUrl(game)}
        aria-label={`Play ${game.ident} in s&box`}>
        <PlayIcon className="enhanced-icon" />
        <span>Play</span>
      </a>

      <div className="tracker-control">
        <button
          ref={trackButtonRef}
          className="enhanced-action enhanced-track"
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={TRACKER_MENU_ID}
          onClick={() => setMenuOpen((open) => !open)}
          onKeyDown={handleTrackButtonKeyDown}>
          <TrackingIcon className="enhanced-icon" />
          <span>Track</span>
          <ChevronIcon
            className={`enhanced-chevron${menuOpen ? " is-open" : ""}`}
          />
        </button>

        {menuOpen && (
          <div className="tracker-menu" id={TRACKER_MENU_ID} role="menu">
            {TRACKERS.map((tracker, index) => (
              <a
                key={tracker.id}
                ref={(element) => {
                  trackerRefs.current[index] = element
                }}
                className="tracker-menu-item"
                role="menuitem"
                href={buildTrackerUrl(tracker, game)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => closeMenu()}
                onKeyDown={(event) => handleTrackerKeyDown(event, index)}>
                <img src={tracker.icon} alt="" aria-hidden="true" />
                <span>{tracker.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
