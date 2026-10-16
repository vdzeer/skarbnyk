/**
 * Every raw value in the app lives in this file. Components read tokens
 * through the theme; a hex or px literal in a `styled.ts` fails a test.
 *
 * Colours are named by role, not by hue. There are two palettes, light and
 * dark, with the same roles. A component never sees a hex: `colors.surface`
 * is a CSS variable, and the palette behind it is swapped on the document
 * (see `GlobalStyle`), so changing the theme repaints nothing in React.
 *
 * Green is money handled: the main action, the current section, "paid".
 * Amber is a deadline coming up. Blue marks a report to file rather than a
 * sum to pay.
 */
const lightColors = {
  background: '#F2F3EE',
  surface: '#FFFFFF',
  /** Boxes inside a card: a breakdown, a hint. */
  surfaceSubtle: '#F2F3EE',
  /** Bar tracks, segmented controls, neutral chips. */
  surfaceSunken: '#E9EBE4',
  border: '#D8DBD1',
  /** Edges of inputs: they have to stand out from the card at 3:1. */
  borderStrong: '#7D857F',
  onSurface: '#121914',
  onSurfaceMuted: '#4F5852',
  primary: '#1C5C44',
  onPrimary: '#FFFFFF',
  /** Behind the current menu item and a "paid" chip. */
  primarySoft: '#DCEEE4',
  onPrimarySoft: '#1C5C44',
  /** The "next payment" panel at the top of the overview. */
  hero: '#14382B',
  onHero: '#FFFFFF',
  onHeroMuted: '#BFE0CF',
  heroPanel: '#1D4A3A',
  heroLine: '#2F5E4C',
  heroOutline: '#6E9C87',
  /** A deadline that is close. */
  warning: '#9A4A0B',
  warningSoft: '#FBE9D7',
  /** The "in N days" badge on the hero panel. */
  badge: '#F6D9B8',
  onBadge: '#5A2C06',
  /** A report to file. */
  info: '#24476E',
  infoSoft: '#DFE7F3',
  danger: '#A3261A',
  dangerSoft: '#F8E1DD',
  /** The keyboard focus ring; it sits outside the control, on the page. */
  focus: '#B4540F',
} as const

export type ColorToken = keyof typeof lightColors

const darkColors: Record<ColorToken, string> = {
  background: '#0E1311',
  surface: '#171E1B',
  surfaceSubtle: '#121815',
  surfaceSunken: '#232C28',
  border: '#2A3430',
  borderStrong: '#6B7770',
  onSurface: '#E8EDE9',
  onSurfaceMuted: '#A7B2AB',
  // On a dark page the filled button is the light thing.
  primary: '#7BD3A8',
  onPrimary: '#0E1311',
  primarySoft: '#1D3B2F',
  onPrimarySoft: '#8FE0BC',
  hero: '#1B4434',
  onHero: '#FFFFFF',
  onHeroMuted: '#BFE0CF',
  heroPanel: '#225240',
  heroLine: '#33664F',
  heroOutline: '#6E9C87',
  warning: '#F2B27A',
  warningSoft: '#3A2A18',
  badge: '#F6D9B8',
  onBadge: '#5A2C06',
  info: '#A9C4EA',
  infoSoft: '#1E2C40',
  danger: '#F0857A',
  dangerSoft: '#3A1F1C',
  focus: '#F2B27A',
}

/** The raw values. Only the theme plumbing, the manifest and tests read these. */
export const palettes = {
  light: { colors: lightColors },
  dark: { colors: darkColors },
} as const

export type ThemeName = keyof typeof palettes

const COLOR_TOKENS = Object.keys(lightColors) as ColorToken[]

const colorVariable = (token: ColorToken) => `--color-${token}`

/** What components use: each role as a reference to its CSS variable. */
export const colors = Object.fromEntries(
  COLOR_TOKENS.map(token => [token, `var(${colorVariable(token)})`]),
) as Record<ColorToken, string>

/** The declarations that give every variable its value in one palette. */
export const paletteCss = (name: ThemeName) =>
  COLOR_TOKENS.map(
    token => `${colorVariable(token)}: ${palettes[name].colors[token]};`,
  ).join('\n')

export const spacing = {
  none: '0',
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '40px',
  xxxl: '56px',
} as const

export const radii = {
  xs: '6px',
  sm: '8px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  xxl: '22px',
  pill: '999px',
} as const

/** Below this width the side menu becomes a tab bar along the bottom edge. */
export const breakpoints = {
  narrow: '760px',
} as const

/** Room a phone keeps for its notch and its home indicator. */
export const insets = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
} as const

export const sizes = {
  hairline: '1px',
  thick: '2px',
  /** Minimum touch target. */
  control: '44px',
  controlLarge: '52px',
  segment: '40px',
  icon: '20px',
  iconSmall: '16px',
  iconLarge: '24px',
  logo: '34px',
  avatar: '36px',
  /** The day-and-month tile in front of a deadline. */
  dateTile: '56px',
  bar: '10px',
  barLarge: '12px',
  barSmall: '6px',
  checkbox: '18px',
  sidebar: '248px',
  /** Height the bottom tab bar takes away from a narrow page. */
  tabBar: '64px',
  /** The round "add" button that floats over a phone's tab bar. */
  fab: '56px',
  navItem: '150px',
  content: '1120px',
  contentNarrow: '760px',
  columnWide: '520px',
  columnNarrow: '320px',
  field: '220px',
  numberField: '120px',
  signInPanel: '520px',
  pitch: '460px',
  /** A table keeps its columns and scrolls sideways on a phone. */
  table: '720px',
  /** The incomes table sits beside the form, so it is allowed to be narrower. */
  tableNarrow: '560px',
} as const

const families = {
  display: "var(--font-display), 'Trebuchet MS', sans-serif",
  body: 'var(--font-body), system-ui, sans-serif',
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
} as const

/**
 * The text scale. Every font size in the app is one of these: `<Text variant>`
 * picks one, and the few controls that style their own label read it here.
 */
export const text = {
  /** The sum on the "next payment" panel. */
  amountHero: {
    family: families.display,
    size: 'clamp(40px, 6vw, 52px)',
    line: '1.05',
    weight: 600,
  },
  amount: {
    family: families.display,
    size: 'clamp(28px, 4vw, 36px)',
    line: '1.15',
    weight: 600,
  },
  pageTitle: {
    family: families.display,
    size: 'clamp(28px, 4vw, 34px)',
    line: '1.2',
    weight: 600,
  },
  amountSmall: {
    family: families.display,
    size: '22px',
    line: '28px',
    weight: 600,
  },
  title: { family: families.display, size: '19px', line: '26px', weight: 600 },
  number: { family: families.display, size: '17px', line: '24px', weight: 600 },
  lead: { family: families.body, size: '17px', line: '26px', weight: 400 },
  body: { family: families.body, size: '15px', line: '22px', weight: 400 },
  bodyStrong: {
    family: families.body,
    size: '15px',
    line: '22px',
    weight: 600,
  },
  secondary: { family: families.body, size: '14px', line: '20px', weight: 400 },
  label: { family: families.body, size: '14px', line: '20px', weight: 500 },
  caption: { family: families.body, size: '13px', line: '18px', weight: 400 },
  /** Month headings over a list of deadlines. */
  overline: { family: families.body, size: '13px', line: '18px', weight: 600 },
  /** Labels of the bottom tab bar: four of them share a phone's width. */
  tab: { family: families.body, size: '11px', line: '14px', weight: 600 },
  /** The recovery key, typed back character by character. */
  code: { family: families.mono, size: '18px', line: '30px', weight: 600 },
} as const

export type TextVariant = keyof typeof text

export const motion = {
  fast: '120ms',
  base: '240ms',
} as const
