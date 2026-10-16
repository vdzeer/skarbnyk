import type { ReactNode } from 'react'

import { Card, Stack, Text } from '~/components'

type Props = {
  id: string
  title: string
  text?: string
  children: ReactNode
}

/** One card of the settings page. */
export const Section = ({ id, title, text, children }: Props) => (
  <Card aria-labelledby={id}>
    <Stack $gap="md">
      <Stack $gap="xxs">
        <Text as="h2" id={id} variant="title">
          {title}
        </Text>
        {text ? (
          <Text variant="secondary" tone="muted">
            {text}
          </Text>
        ) : null}
      </Stack>
      {children}
    </Stack>
  </Card>
)
