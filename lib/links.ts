import type { GameIdentity } from "./game-identity"

const SBOX_STEAM_APP_ID = "590830"

export function buildSteamLaunchUrl(game: GameIdentity): string {
  return `steam://run/${SBOX_STEAM_APP_ID}//-rungame%20${game.ident}/`
}
