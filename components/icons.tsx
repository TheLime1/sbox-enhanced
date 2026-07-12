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
