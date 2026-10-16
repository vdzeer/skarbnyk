import type { Metadata, Viewport } from 'next'
import { Geologica, Onest } from 'next/font/google'
import type { ReactNode } from 'react'

import { APP_DESCRIPTION, APP_NAME } from '~/services/brand'
import { StyledRegistry, palettes } from '~/themes'
import { THEME_SCRIPT } from '~/types'

import { AppProviders } from './providers'

// Two typefaces, both with full Ukrainian coverage including ʼ: a geometric
// one for titles and sums, a calm one for everything else.
const display = Geologica({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const body = Onest({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  // Opened from an iPhone home screen, the app runs without browser chrome.
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Draw under the notch and the home indicator; the layout pads for them.
  viewportFit: 'cover',
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: palettes.light.colors.background,
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: palettes.dark.colors.background,
    },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme script below changes an attribute of this element before
    // React starts, which is the one difference hydration is told to accept.
    <html
      lang="uk"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <StyledRegistry>
          <AppProviders>{children}</AppProviders>
        </StyledRegistry>
      </body>
    </html>
  )
}
