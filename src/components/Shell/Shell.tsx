'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { APP_NAME } from '~/services/brand'
import { useT, type TranslationKey } from '~/services/i18n'
import { useSyncStore } from '~/store'
import { ROUTES, TAB_ROUTES, activeTab, type TabRoute } from '~/types'

import { Button } from '../Button'
import { Icon, type IconName } from '../Icon'
import { Logo } from '../Logo'
import { Text } from '../Text'

import {
  Account,
  Banner,
  Brand,
  Content,
  Foot,
  Frame,
  Main,
  Nav,
  NavLink,
  Sidebar,
} from './styled'

const ITEMS: Record<TabRoute, { icon: IconName; label: TranslationKey }> = {
  [ROUTES.Overview]: { icon: 'overview', label: 'nav_overview' },
  [ROUTES.Incomes]: { icon: 'incomes', label: 'nav_incomes' },
  [ROUTES.Deadlines]: { icon: 'deadlines', label: 'nav_deadlines' },
  [ROUTES.Settings]: { icon: 'settings', label: 'nav_settings' },
}

type Props = {
  /** Who is signed in, shown at the foot of the side menu. */
  email: string
  onLock: () => void
  children: ReactNode
}

export const Shell = ({ email, onLock, children }: Props) => {
  const t = useT()
  const pathname = usePathname()
  const failed = useSyncStore(state => state.failed)
  const current = activeTab(pathname)

  return (
    <Frame>
      <Sidebar>
        <Brand href={ROUTES.Overview}>
          <Logo />
          <Text variant="title" tone="inherit">
            {APP_NAME}
          </Text>
        </Brand>
        <Nav aria-label={t('nav_label')}>
          {TAB_ROUTES.map(route => (
            <NavLink
              key={route}
              href={route}
              $active={route === current}
              aria-current={route === current ? 'page' : undefined}>
              <Icon name={ITEMS[route].icon} />
              <Text
                variant={route === current ? 'bodyStrong' : 'body'}
                narrowVariant="tab"
                tone="inherit">
                {t(ITEMS[route].label)}
              </Text>
            </NavLink>
          ))}
        </Nav>
        <Foot>
          <Account>
            <Text variant="caption" tone="muted">
              {t('shell_signed_in')}
            </Text>
            <Text variant="secondary">{email}</Text>
          </Account>
          <Button icon="lock" stretch onClick={onLock}>
            {t('action_lock')}
          </Button>
        </Foot>
      </Sidebar>
      <Main>
        <Content $narrow={current === ROUTES.Settings}>
          {failed ? (
            <Banner role="alert">
              <Text>{t('sync_error')}</Text>
              <Button onClick={() => window.location.reload()}>
                {t('sync_reload')}
              </Button>
            </Banner>
          ) : null}
          {children}
        </Content>
      </Main>
    </Frame>
  )
}
