import type { MetadataRoute } from 'next'

import { APP_DESCRIPTION, APP_NAME } from '~/services/brand'
// The tokens file alone: the themes barrel also loads styled-components,
// which this build-time file has no use for.
import { palettes } from '~/themes/tokens'

// The app is a static export, so the manifest is written once at build time.
export const dynamic = 'force-static'

/** What a phone needs to put the app on its home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    lang: 'uk',
    start_url: '/',
    display: 'standalone',
    background_color: palettes.light.colors.background,
    theme_color: palettes.light.colors.background,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
