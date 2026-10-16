import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import manifest from '../manifest'

const ROOT = join(__dirname, '..', '..', '..')

/** Width and height from a PNG's header. */
const pngSize = (path: string) => {
  const file = readFileSync(path)
  return `${file.readUInt32BE(16)}x${file.readUInt32BE(20)}`
}

describe('web manifest', () => {
  const { icons = [], ...rest } = manifest()

  it('opens the app full screen from the home screen', () => {
    expect(rest.display).toBe('standalone')
    expect(rest.start_url).toBe('/')
  })

  it('offers a 192 and a 512 icon, and one a launcher may crop', () => {
    expect(icons.map(icon => icon.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    )
    expect(icons.some(icon => icon.purpose === 'maskable')).toBe(true)
  })

  it.each(icons.map(icon => [icon.src, icon.sizes]))(
    '%s exists and is %s',
    (src, sizes) => {
      const path = join(ROOT, 'public', src)

      expect(existsSync(path)).toBe(true)
      expect(pngSize(path)).toBe(sizes)
    },
  )

  it('has the tab icon and the iPhone icon next to the layout', () => {
    expect(pngSize(join(ROOT, 'src', 'app', 'icon.png'))).toBe('96x96')
    expect(pngSize(join(ROOT, 'src', 'app', 'apple-icon.png'))).toBe('180x180')
  })
})
