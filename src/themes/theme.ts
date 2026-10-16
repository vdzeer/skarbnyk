import {
  breakpoints,
  colors,
  insets,
  motion,
  radii,
  sizes,
  spacing,
  text,
} from './tokens'

export const theme = {
  colors,
  spacing,
  radii,
  sizes,
  breakpoints,
  insets,
  text,
  motion,
} as const

export type AppTheme = typeof theme
