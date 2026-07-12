import "@fontsource/poppins/latin-500.css"
import "@fontsource/poppins/latin-600.css"
import "@fontsource/poppins/latin-800.css"
import "./popup.css"

import limeStudioLogo from "data-base64:~assets/limestudio.png"

const GITHUB_URL = "https://github.com/TheLime1"
const LIMESTUDIO_URL = "https://sbox.game/limestudio"

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.34-3.8-1.34-.51-1.3-1.25-1.65-1.25-1.65-1.03-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.5-.29-5.14-1.25-5.14-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15A10.75 10.75 0 0 1 12 6.1c.96 0 1.91.13 2.81.38 2.15-1.46 3.1-1.15 3.1-1.15.62 1.55.24 2.7.12 2.98.72.79 1.16 1.8 1.16 3.02 0 4.32-2.64 5.27-5.15 5.55.4.35.76 1.03.76 2.08v3.17c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.2 5.3 19.9 12l-6.7 6.7-1.4-1.4 4.3-4.3H4v-2h12.1l-4.3-4.3 1.4-1.4Z" />
    </svg>
  )
}

export default function Popup() {
  return (
    <main className="popup-shell">
      <header className="popup-header">
        <div className="brand" aria-label="s&box Enhanced">
          <span className="brand-sbox">s&box</span>
          <span className="brand-enhanced">Enhanced</span>
        </div>
        <p>Launch games faster and find their community stats.</p>
      </header>

      <nav className="popup-actions" aria-label="Project links">
        <a
          className="popup-action github-action"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer">
          <span className="action-icon github-icon">
            <GitHubIcon />
          </span>
          <span className="action-copy">
            <strong>Contribute</strong>
            <small>Help improve s&box Enhanced</small>
          </span>
          <ArrowIcon />
        </a>

        <a
          className="popup-action lime-action"
          href={LIMESTUDIO_URL}
          target="_blank"
          rel="noopener noreferrer">
          <span className="action-icon lime-icon">
            <img src={limeStudioLogo} alt="" aria-hidden="true" />
          </span>
          <span className="action-copy">
            <strong>Try LimeStudio</strong>
            <small>Explore our games on sbox.game</small>
          </span>
          <ArrowIcon />
        </a>
      </nav>
    </main>
  )
}
