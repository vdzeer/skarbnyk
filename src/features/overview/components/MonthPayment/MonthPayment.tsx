'use client'

import { useState } from 'react'

import { Button, Row, Stack, Text } from '~/components'
import type { Obligation, Requisites } from '~/core'
import { PaymentDetails } from '~/features/ledger/components'
import { obligationTitle } from '~/features/ledger/services'
import { formatMoney } from '~/services/format'
import { useT } from '~/services/i18n'

import { Line, Panel, Total } from './styled'

type Props = {
  title: string
  payments: Obligation[]
  requisites: Requisites
  /** The month is not over: more money may still come in. */
  running: boolean
  /** Paid before; this is only what came in since. */
  topUp: boolean
  onPaid: () => void
  onClose: () => void
}

/** One month's payments, paid ahead of its quarter. */
export const MonthPayment = ({
  title,
  payments,
  requisites,
  running,
  topUp,
  onPaid,
  onClose,
}: Props) => {
  const t = useT()
  const [details, setDetails] = useState<string | null>(null)
  const total = payments.reduce((sum, item) => sum + (item.amount ?? 0), 0)

  const note = () => {
    if (topUp) return t('month_pay_topup')
    return running ? t('month_pay_running') : t('month_pay_note')
  }

  return (
    <Panel aria-label={title}>
      <Text variant="bodyStrong">{title}</Text>
      <Stack $gap="xs">
        {payments.map(payment => (
          <Stack key={payment.id} $gap="xs">
            <Line>
              <Text>{obligationTitle(t, payment)}</Text>
              <Text nowrap variant="bodyStrong">
                {formatMoney(payment.amount ?? 0)}
              </Text>
            </Line>
            <Button
              variant="ghost"
              icon={details === payment.id ? 'chevronDown' : 'chevron'}
              aria-expanded={details === payment.id}
              onClick={() =>
                setDetails(current =>
                  current === payment.id ? null : payment.id,
                )
              }>
              {t('next_details')}
            </Button>
            {details === payment.id ? (
              <PaymentDetails obligation={payment} requisites={requisites} />
            ) : null}
          </Stack>
        ))}
      </Stack>
      <Total>
        <Text variant="bodyStrong">{t('total')}</Text>
        <Text nowrap variant="amountSmall">
          {t('money_uah', { amount: formatMoney(total) })}
        </Text>
      </Total>
      <Text variant="caption" tone="muted">
        {note()}
      </Text>
      <Row>
        <Button variant="primary" icon="check" onClick={onPaid}>
          {t('mark_paid')}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t('action_close')}
        </Button>
      </Row>
    </Panel>
  )
}
