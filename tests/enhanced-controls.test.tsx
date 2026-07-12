import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { EnhancedControls } from "../components/enhanced-controls"

function setGamePage() {
  window.history.replaceState(
    {},
    "",
    "https://sbox.game/limestudio/auto_blocks"
  )
  document.body.innerHTML = `
    <header class="package-site-header">
      <a class="meta-pill type" href="/ugc/game">game</a>
      <div class="package-header-buttons"></div>
    </header>
  `
}

describe("EnhancedControls", () => {
  beforeEach(setGamePage)

  it("renders Play and Track as a single full-width two-column row", () => {
    render(<EnhancedControls />)

    expect(screen.getByTestId("controls")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /play/i })).toHaveAttribute(
      "href",
      "steam://run/590830//-rungame%20limestudio.auto_blocks/"
    )
    expect(screen.getByRole("button", { name: "Track" })).toHaveAttribute(
      "aria-expanded",
      "false"
    )
  })

  it("opens safe tracker links and closes with Escape", async () => {
    render(<EnhancedControls />)

    const trackButton = screen.getByRole("button", { name: "Track" })
    fireEvent.click(trackButton)

    expect(trackButton).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("menu")).toBeInTheDocument()

    const watchLink = screen.getByRole("menuitem", { name: "s&box watch" })
    expect(watchLink).toHaveAttribute("target", "_blank")
    expect(watchLink).toHaveAttribute("rel", "noopener noreferrer")

    fireEvent.keyDown(document, { key: "Escape" })

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
    expect(trackButton).toHaveFocus()
  })

  it("supports Arrow Down and Arrow Up menu navigation", async () => {
    render(<EnhancedControls />)

    const trackButton = screen.getByRole("button", { name: "Track" })
    trackButton.focus()
    fireEvent.keyDown(trackButton, { key: "ArrowDown" })

    const watchLink = await screen.findByRole("menuitem", {
      name: "s&box watch"
    })
    const dbLink = screen.getByRole("menuitem", { name: "s&boxDB" })

    await waitFor(() => expect(watchLink).toHaveFocus())
    fireEvent.keyDown(watchLink, { key: "ArrowDown" })
    expect(dbLink).toHaveFocus()
    fireEvent.keyDown(dbLink, { key: "ArrowUp" })
    expect(watchLink).toHaveFocus()
  })

  it("closes when the user clicks outside the controls", async () => {
    render(<EnhancedControls />)

    fireEvent.click(screen.getByRole("button", { name: "Track" }))
    expect(screen.getByRole("menu")).toBeInTheDocument()

    fireEvent.pointerDown(document.body)

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
  })
})
