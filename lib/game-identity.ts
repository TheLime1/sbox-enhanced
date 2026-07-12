export interface GameIdentity {
  organization: string
  game: string
  ident: string
}

const VALID_SEGMENT = /^[a-z0-9][a-z0-9_-]*$/i

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

export function parseGameIdentity(url: URL | string): GameIdentity | null {
  let parsedUrl: URL

  try {
    parsedUrl = typeof url === "string" ? new URL(url) : url
  } catch {
    return null
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "sbox.game") {
    return null
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean)
  if (segments.length < 2) return null

  const organization = safeDecode(segments[0])
  const game = safeDecode(segments[1])

  if (
    !organization ||
    !game ||
    !VALID_SEGMENT.test(organization) ||
    !VALID_SEGMENT.test(game)
  ) {
    return null
  }

  return {
    organization,
    game,
    ident: `${organization}.${game}`
  }
}

export function resolveGameIdentity(
  url: URL | string,
  root: ParentNode
): GameIdentity | null {
  const gameTypeLink = root.querySelector<HTMLAnchorElement>(
    '.package-site-header a.meta-pill.type[href="/ugc/game"], a.meta-pill.type[href="/ugc/game"]'
  )

  if (!gameTypeLink) return null
  return parseGameIdentity(url)
}
