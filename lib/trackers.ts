import sboxDbIcon from "data-base64:~assets/trackers/sboxdb.svg"
import sboxWatchIcon from "data-base64:~assets/trackers/sbox-watch.png"

import type { GameIdentity } from "./game-identity"

export interface TrackerDefinition {
  id: string
  label: string
  icon: string
  urlTemplate: string
}

export const TRACKERS = [
  {
    id: "sbox-watch",
    label: "s&box watch",
    icon: sboxWatchIcon,
    urlTemplate: "https://sbox.watch/games/{organization}/{game}/"
  },
  {
    id: "sboxdb",
    label: "s&boxDB",
    icon: sboxDbIcon,
    urlTemplate: "https://sboxdb.dev/package/{organization}/{game}"
  }
] as const satisfies readonly TrackerDefinition[]

export function buildTrackerUrl(
  tracker: TrackerDefinition,
  game: GameIdentity
): string {
  return tracker.urlTemplate
    .replaceAll("{organization}", encodeURIComponent(game.organization))
    .replaceAll("{game}", encodeURIComponent(game.game))
}
