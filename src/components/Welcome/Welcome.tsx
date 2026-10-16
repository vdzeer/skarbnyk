import type { ReactNode } from 'react'

import { APP_NAME } from '~/services/brand'
import { useT, type TranslationKey } from '~/services/i18n'

import { Icon } from '../Icon'
import { Logo } from '../Logo'
import { Text } from '../Text'

import { Brand, Page, Panel, Pitch, Point, Points, Slot } from './styled'

const POINTS: TranslationKey[] = [
  'welcome_point_count',
  'welcome_point_deadlines',
  'welcome_point_privacy',
]

/** The frame of every screen before the app opens: what it is, then a step. */
export const Welcome = ({ children }: { children: ReactNode }) => {
  const t = useT()

  return (
    <Page>
      <Pitch>
        <Brand>
          <Logo />
          <Text variant="title" tone="inherit">
            {APP_NAME}
          </Text>
        </Brand>
        <Text as="h1" variant="pageTitle" tone="inherit">
          {t('welcome_title')}
        </Text>
        <Points>
          {POINTS.map(key => (
            <Point key={key}>
              <Icon name="check" />
              <Text tone="inherit">{t(key)}</Text>
            </Point>
          ))}
        </Points>
      </Pitch>
      <Panel>
        <Slot>{children}</Slot>
      </Panel>
    </Page>
  )
}
