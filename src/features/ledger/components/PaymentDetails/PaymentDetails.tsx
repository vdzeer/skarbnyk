'use client'

import { useState } from 'react'

import { Button, Text } from '~/components'
import type { Account, Obligation, Requisites } from '~/core'
import { copyText } from '~/services/download'
import { formatMoney } from '~/services/format'
import { useT, type TranslationKey } from '~/services/i18n'
import { ROUTES } from '~/types'

import { paymentPurpose } from '../../services'

import { Line, List, Value } from './styled'

const ACCOUNT: Record<
  Exclude<Obligation['kind'], 'declaration'>,
  keyof Requisites
> = {
  single_tax: 'singleTax',
  levy: 'levy',
  esv: 'esv',
}

type Props = {
  obligation: Obligation
  requisites: Requisites
}

/** Everything a bank form asks for, each with its own copy button. */
export const PaymentDetails = ({ obligation, requisites }: Props) => {
  const t = useT()
  const [copied, setCopied] = useState<string | null>(null)

  if (obligation.kind === 'declaration') return null
  const account = requisites[ACCOUNT[obligation.kind]] as Account

  if (!account.iban) {
    return (
      <List>
        <Text variant="secondary">{t('payment_missing')}</Text>
        <Button href={ROUTES.Settings} variant="secondary">
          {t('payment_fill')}
        </Button>
      </List>
    )
  }

  const lines: [TranslationKey, string][] = [
    ['payment_recipient', account.recipient],
    ['payment_code', account.code],
    ['payment_iban', account.iban],
    ['payment_amount', formatMoney(obligation.amount ?? 0)],
    ['payment_purpose', paymentPurpose(t, obligation, requisites.taxId)],
  ]

  const copy = async (key: string, value: string) => {
    if (await copyText(value)) setCopied(key)
  }

  return (
    <List>
      {lines
        .filter(([, value]) => value !== '')
        .map(([label, value]) => (
          <Line key={label}>
            <Value>
              <Text variant="caption" tone="muted">
                {t(label)}
              </Text>
              <Text variant="secondary">{value}</Text>
            </Value>
            <Button
              variant="ghost"
              icon={copied === label ? 'check' : 'copy'}
              aria-label={t('payment_copy', { field: t(label) })}
              onClick={() => copy(label, value)}
            />
          </Line>
        ))}
    </List>
  )
}
