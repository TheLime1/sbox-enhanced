import { render, screen } from "@testing-library/react"

import Popup from "../popup"

describe("extension popup", () => {
  it("renders the s&box Enhanced brand", () => {
    render(<Popup />)

    expect(screen.getByLabelText("s&box Enhanced")).toBeInTheDocument()
    expect(screen.getByText("s&box")).toBeInTheDocument()
    expect(screen.getByText("Enhanced")).toBeInTheDocument()
  })

  it("links to GitHub and LimeStudio safely", () => {
    render(<Popup />)

    expect(screen.getByRole("link", { name: /contribute/i })).toHaveAttribute(
      "href",
      "https://github.com/TheLime1/sbox-enhanced"
    )
    expect(screen.getByRole("link", { name: /try limestudio/i })).toHaveAttribute(
      "href",
      "https://sbox.game/limestudio"
    )

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    }
  })
})
