import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/** Shared frame: 24px grid, stroke-only, inherits the current text colour. */
function IconBase({ children, ...rest }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------- Navigation */

export function DashboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </IconBase>
  )
}

export function MarketsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 17.5 8.5 11l4 4L21 6" />
      <path d="M21 11V6h-5" />
    </IconBase>
  )
}

export function WatchlistsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3.8 2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 17.1l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85Z" />
    </IconBase>
  )
}

export function PortfoliosIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2.5" y="7" width="19" height="13.5" rx="2.5" />
      <path d="M8.5 7V5.6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7" />
      <path d="M2.5 12.5h19" />
    </IconBase>
  )
}

/* ---------------------------------------------------------------- Controls */

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.5 6.5h17" />
      <path d="M3.5 12h17" />
      <path d="M3.5 17.5h17" />
    </IconBase>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5.5 5.5l13 13" />
      <path d="M18.5 5.5l-13 13" />
    </IconBase>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15 3.5h3.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H15" />
      <path d="M10 16.5 14.5 12 10 7.5" />
      <path d="M14.5 12H3.5" />
    </IconBase>
  )
}

/* ---------------------------------------------------------------- Password */

export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </IconBase>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 3.5 21 21" />
      <path d="M10.6 6A9.9 9.9 0 0 1 12 5.75c6 0 9.5 6.25 9.5 6.25a17.6 17.6 0 0 1-3.3 4" />
      <path d="M6.6 8A17.4 17.4 0 0 0 2.5 12S6 18.25 12 18.25a9.9 9.9 0 0 0 3.4-.55" />
      <path d="M9.9 10a2.9 2.9 0 0 0 4.1 4.1" />
    </IconBase>
  )
}
