import { palettes, type ColorToken, type ThemeName } from '../tokens'

// WCAG 2 contrast, computed from the tokens themselves: text needs 4.5:1,
// icons and the edges of controls need 3:1. Both palettes are held to it.

const TEXT = 4.5
const GRAPHIC = 3

const channel = (value: number) => {
  const share = value / 255
  return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string) => {
  const [red, green, blue] = [1, 3, 5].map(at =>
    channel(parseInt(hex.slice(at, at + 2), 16)),
  )
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

const contrast = (one: string, other: string) => {
  const [light, dark] = [luminance(one), luminance(other)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

const SURFACES: ColorToken[] = [
  'background',
  'surface',
  'surfaceSubtle',
  'surfaceSunken',
]

/** Text colour → the fills it is written on. */
const TEXT_PAIRS: [ColorToken, ColorToken][] = [
  ['onPrimary', 'primary'],
  ['onPrimarySoft', 'primarySoft'],
  ['onSurface', 'primarySoft'],
  ['onHero', 'hero'],
  ['onHeroMuted', 'hero'],
  ['onHero', 'heroPanel'],
  ['onHeroMuted', 'heroPanel'],
  ['onBadge', 'badge'],
  ['warning', 'warningSoft'],
  ['warning', 'surface'],
  ['info', 'infoSoft'],
  ['danger', 'surface'],
  ['danger', 'dangerSoft'],
  ['onSurface', 'dangerSoft'],
  ['onSurface', 'warningSoft'],
]

const THEMES = Object.keys(palettes) as ThemeName[]

describe.each(THEMES)('the %s palette', name => {
  const { colors } = palettes[name]

  it.each(SURFACES)('text reads on %s in both tones', surface => {
    expect(contrast(colors.onSurface, colors[surface])).toBeGreaterThanOrEqual(
      TEXT,
    )
    expect(
      contrast(colors.onSurfaceMuted, colors[surface]),
    ).toBeGreaterThanOrEqual(TEXT)
  })

  it.each(TEXT_PAIRS)('%s reads on %s', (ink, fill) => {
    expect(contrast(colors[ink], colors[fill])).toBeGreaterThanOrEqual(TEXT)
  })

  it.each(['surface', 'background'] as const)(
    'input edges show against %s',
    around => {
      expect(
        contrast(colors.borderStrong, colors[around]),
      ).toBeGreaterThanOrEqual(GRAPHIC)
    },
  )

  it.each(['surface', 'background'] as const)(
    'the focus ring shows against %s',
    around => {
      expect(contrast(colors.focus, colors[around])).toBeGreaterThanOrEqual(
        GRAPHIC,
      )
    },
  )

  it('the outline button shows on the hero panel', () => {
    expect(contrast(colors.heroOutline, colors.hero)).toBeGreaterThanOrEqual(
      GRAPHIC,
    )
  })

  it('a progress bar shows on its track', () => {
    expect(
      contrast(colors.primary, colors.surfaceSunken),
    ).toBeGreaterThanOrEqual(GRAPHIC)
  })
})

describe('the palettes', () => {
  it('define the same roles', () => {
    expect(Object.keys(palettes.dark.colors).sort()).toEqual(
      Object.keys(palettes.light.colors).sort(),
    )
  })
})
