import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M8 5.6v12.8c0 .78.86 1.25 1.51.82l9.04-6.4a1 1 0 0 0 0-1.64l-9.04-6.4A.99.99 0 0 0 8 5.6Z" />
    </svg>
  )
}

export function TrackingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4.5 19.25a.75.75 0 0 1-.75-.75v-5a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-.75.75Zm5 0a.75.75 0 0 1-.75-.75v-9a.75.75 0 0 1 1.5 0v9a.75.75 0 0 1-.75.75Zm5 0a.75.75 0 0 1-.75-.75v-13a.75.75 0 0 1 1.5 0v13a.75.75 0 0 1-.75.75Zm5 0a.75.75 0 0 1-.75-.75v-7a.75.75 0 0 1 1.5 0v7a.75.75 0 0 1-.75.75Z" />
    </svg>
  )
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m7.4 9.4 4.6 4.6 4.6-4.6 1.4 1.4-6 6-6-6 1.4-1.4Z" />
    </svg>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M11 4a1 1 0 1 1 2 0v9.59l2.3-2.3a1 1 0 0 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.42l2.3 2.3V4Zm-5 14a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M6.3 6.3a1 1 0 0 1 1.4 0l4.3 4.29 4.3-4.3a1 1 0 1 1 1.4 1.42L13.42 12l4.3 4.3a1 1 0 0 1-1.42 1.4L12 13.42l-4.3 4.3a1 1 0 0 1-1.4-1.42l4.29-4.3-4.3-4.3a1 1 0 0 1 0-1.4Z" />
    </svg>
  )
}

export function WarningIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M10.25 4.17a2 2 0 0 1 3.5 0l7.3 13.3A2 2 0 0 1 19.3 20H4.7a2 2 0 0 1-1.75-2.53l7.3-13.3ZM12 7a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm0 8.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    </svg>
  )
}
