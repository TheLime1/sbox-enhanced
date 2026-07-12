import { buildTrackerUrl, TRACKERS } from "../lib/trackers"

const game = {
  organization: "limestudio",
  game: "auto_blocks",
  ident: "limestudio.auto_blocks"
}

describe("tracker registry", () => {
  it("builds the s&box watch URL", () => {
    expect(buildTrackerUrl(TRACKERS[0], game)).toBe(
      "https://sbox.watch/games/limestudio/auto_blocks/"
    )
  })

  it("builds the s&boxDB URL", () => {
    expect(buildTrackerUrl(TRACKERS[1], game)).toBe(
      "https://sboxdb.dev/package/limestudio/auto_blocks"
    )
  })
})
