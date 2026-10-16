import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // No server: every page is prerendered to static HTML and all data is read
  // in the browser, so the app fits Firebase Hosting on the free plan.
  output: 'export',
  compiler: { styledComponents: true },
  images: { unoptimized: true },
}

export default nextConfig
