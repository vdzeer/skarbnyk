import { buildCalendar, type Obligation } from '~/core'
import { APP_NAME } from '~/services/brand'
import type { Translate } from '~/services/i18n'
import { obligationTitle } from '~/features/ledger/services'

const DOMAIN = 'skarbnyk.web.app'

/** `20261014T090000Z` for a moment. */
export const calendarStamp = (moment: Date) =>
  moment
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

/**
 * The year's deadlines as a calendar file. No sums: a calendar is often
 * synced to someone else's server, and the sums are what the app encrypts.
 */
export const deadlinesCalendar = (
  t: Translate,
  obligations: Obligation[],
  moment: Date,
) =>
  buildCalendar(
    APP_NAME,
    obligations.map(obligation => ({
      uid: `${obligation.id}@${DOMAIN}`,
      day: obligation.due,
      title: t('calendar_event', {
        app: APP_NAME,
        what: obligationTitle(t, obligation),
      }),
      description:
        obligation.action === 'filed'
          ? t('calendar_file')
          : t('calendar_pay', { app: APP_NAME }),
    })),
    calendarStamp(moment),
  )
