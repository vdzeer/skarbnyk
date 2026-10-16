'use client'

import { Button, StatePanel, Welcome } from '~/components'
import { useT } from '~/services/i18n'

/**
 * What a crash on any screen shows instead of an empty page. The data is
 * safe on the server; reloading usually brings the screen back.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useT()

  return (
    <Welcome>
      <StatePanel
        role="alert"
        title={t('crash_title')}
        text={t('crash_text')}
        actions={
          <>
            <Button variant="primary" onClick={reset}>
              {t('action_retry')}
            </Button>
            <Button onClick={() => window.location.reload()}>
              {t('sync_reload')}
            </Button>
          </>
        }
      />
    </Welcome>
  )
}
