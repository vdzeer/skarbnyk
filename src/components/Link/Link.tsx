import NextLink from 'next/link'
import type { ReactNode } from 'react'

import { Anchor } from './styled'

/** An inline link inside text. Outside links open in a new tab. */
export const Link = ({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) =>
  href.startsWith('http') ? (
    <Anchor as="a" href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </Anchor>
  ) : (
    <Anchor as={NextLink} href={href}>
      {children}
    </Anchor>
  )
