import { iconPaths } from './iconPaths'

export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}
