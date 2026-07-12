import {
  parseGameIdentity,
  resolveGameIdentity
} from "../lib/game-identity"
import { buildSteamLaunchUrl } from "../lib/links"

function addPackageHeader(type: "game" | "model" = "game") {
  document.body.innerHTML = `
    <header class="package-site-header">
      <a class="meta-pill type" href="/ugc/${type}">${type}</a>
      <div class="package-header-buttons"></div>
    </header>
  `
}

describe("game identity", () => {
  it.each([
    "https://sbox.game/limestudio/auto_blocks",
    "https://sbox.game/limestudio/auto_blocks/changes",
    "https://sbox.game/limestudio/auto_blocks/forum",
    "https://sbox.game/limestudio/auto_blocks/reviews",
    "https://sbox.game/limestudio/auto_blocks/metrics/insights"
  ])("parses game pages and subpages: %s", (url) => {
    expect(parseGameIdentity(url)).toEqual({
      organization: "limestudio",
      game: "auto_blocks",
      ident: "limestudio.auto_blocks"
    })
  })

  it.each([
    "not-a-url",
    "http://sbox.game/limestudio/auto_blocks",
    "https://example.com/limestudio/auto_blocks",
    "https://sbox.game/limestudio",
    "https://sbox.game/limestudio/auto%2Fblocks"
  ])("rejects invalid package URLs: %s", (url) => {
    expect(parseGameIdentity(url)).toBeNull()
  })

  it("requires the page to identify the package as a game", () => {
    addPackageHeader("model")
    expect(
      resolveGameIdentity(
        "https://sbox.game/limestudio/auto_blocks",
        document
      )
    ).toBeNull()
  })

  it("builds the exact s&box Steam launch URL", () => {
    const game = parseGameIdentity(
      "https://sbox.game/limestudio/auto_blocks"
    )

    expect(game).not.toBeNull()
    expect(buildSteamLaunchUrl(game!)).toBe(
      "steam://run/590830//-rungame%20limestudio.auto_blocks/"
    )
  })
})
