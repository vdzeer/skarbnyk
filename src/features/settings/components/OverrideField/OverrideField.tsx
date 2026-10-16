'use client'

import { useState } from 'react'

import { Field, TextInput, Text } from '~/components'
import {
  formatMoney,
  formatPercent,
  moneyInput,
  parseMoney,
  parsePercent,
} from '~/services/format'
import { useT } from '~/services/i18n'

type Props = {
  id: string
  label: string
  kind: 'percent' | 'money'
  /** What the law says; shown as the placeholder and the hint. */
  law: number
  /** What the user set; undefined follows the law. */
  value: number | undefined
  onChange: (value: number | undefined) => void
}

/** A number the law sets and the user may replace; empty means "as the law". */
export const OverrideField = ({
  id,
  label,
  kind,
  law,
  value,
  onChange,
}: Props) => {
  const t = useT()
  const show = (number: number) =>
    kind === 'percent' ? formatPercent(number) : moneyInput(number)
  const [text, setText] = useState(value === undefined ? '' : show(value))
  const [invalid, setInvalid] = useState(false)

  const commit = () => {
    if (text.trim() === '') {
      setInvalid(false)
      onChange(undefined)
      return
    }
    const parsed = kind === 'percent' ? parsePercent(text) : parseMoney(text)
    setInvalid(parsed === null)
    if (parsed !== null) onChange(parsed === law ? undefined : parsed)
  }

  const lawText =
    kind === 'percent'
      ? `${formatPercent(law)}%`
      : `${formatMoney(law)} ${t('unit_uah')}`

  return (
    <Field
      label={label}
      htmlFor={id}
      error={invalid ? t('form_invalid_number') : undefined}>
      <TextInput
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={show(law)}
        aria-invalid={invalid}
        onChange={event => setText(event.target.value)}
        onBlur={commit}
      />
      <Text variant="caption" tone="muted">
        {value === undefined
          ? t('rates_as_law', { value: lawText })
          : t('rates_changed', { value: lawText })}
      </Text>
    </Field>
  )
}
