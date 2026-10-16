'use client'

import { useState, type FormEvent } from 'react'

import {
  Button,
  Card,
  DateInput,
  Field,
  Row,
  Segmented,
  Stack,
  Text,
  TextInput,
} from '~/components'
import {
  CURRENCIES,
  isDayKey,
  monthOf,
  monthlyPlanDue,
  percentOf,
  quarterOf,
  quarterPaymentDue,
  yearOf,
  type PaySchedule,
  type DayKey,
  type Income,
  type YearRates,
} from '~/core'
import {
  DAY_MONTH,
  formatDay,
  formatDue,
  formatMoney,
  formatRate,
  moneyInput,
} from '~/services/format'
import { useT, type TranslationKey } from '~/services/i18n'

import { QUARTER_NAMES, quarterMonths } from '~/features/ledger/services'

import { useNbuRate } from '../../hooks'
import {
  computedUah,
  draftFromIncome,
  emptyDraft,
  readDraft,
  type IncomeDraft,
  type IncomeError,
} from '../../services'

import { Preview, PreviewRow } from './styled'

const ERROR_KEYS: Record<IncomeError, TranslationKey> = {
  required: 'form_required',
  invalid: 'form_invalid_number',
  future: 'income_error_future',
  old: 'income_error_old',
  long: 'income_error_note',
}

type Props = {
  /** Null for a new income. */
  income: Income | null
  today: DayKey
  /** For the tax preview: the rates of the year and the group's percent. */
  rates: YearRates | null
  percent: number | null
  schedule: PaySchedule
  onSave: (value: Omit<Income, 'id'>) => Promise<void>
  onDelete: (() => void) | null
  onClose: () => void
}

export const IncomeForm = ({
  income,
  today,
  rates,
  percent,
  schedule,
  onSave,
  onDelete,
  onClose,
}: Props) => {
  const t = useT()
  const [draft, setDraft] = useState<IncomeDraft>(() =>
    income ? draftFromIncome(income) : emptyDraft(today),
  )
  const [tried, setTried] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const nbu = useNbuRate(draft.currency, draft.day, today)
  const foreign = draft.currency !== 'UAH'

  const update = (patch: Partial<IncomeDraft>) =>
    setDraft(current => ({ ...current, ...patch }))

  // The NBU rate fills the field until the user types their own.
  const shown: IncomeDraft =
    foreign && !draft.rateManual && nbu.data
      ? { ...draft, rate: formatRate(nbu.data) }
      : draft

  const read = readDraft(shown, today)
  const errors = tried && !read.ok ? read.errors : {}
  const uah = draft.uahManual ? null : computedUah(shown)
  const shownUah = read.ok ? read.value.uah : uah
  const computedText = uah === null ? '' : moneyInput(uah)

  /** Which quarter the money falls in and by when its tax is paid. */
  const quarterLine = () => {
    if (!isDayKey(draft.day)) return null
    const quarter = quarterOf(draft.day)
    const legal = formatDue(
      quarterPaymentDue(yearOf(draft.day), quarter),
      today,
    )
    const where = t('income_quarter', {
      quarter: QUARTER_NAMES[quarter],
      months: quarterMonths(t, quarter),
    })
    const planned = formatDue(
      monthlyPlanDue(yearOf(draft.day), monthOf(draft.day)),
      today,
    )
    return schedule === 'monthly'
      ? `${where}. ${t('income_pay_monthly', { planned, legal })}`
      : `${where}. ${t('income_pay_by', { legal })}`
  }

  const rateHint = () => {
    if (nbu.isFetching) return t('income_rate_loading')
    if (nbu.isError) return t('income_rate_failed')
    if (!isDayKey(draft.day)) return t('income_rate_no_day')
    return t('income_rate_hint', { date: formatDay(draft.day, DAY_MONTH) })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTried(true)
    if (!read.ok) return
    setPending(true)
    try {
      await onSave(read.value)
    } finally {
      setPending(false)
    }
  }

  const errorText = (field: keyof typeof errors) =>
    errors[field] ? t(ERROR_KEYS[errors[field]]) : undefined

  return (
    <Card
      as="form"
      onSubmit={submit}
      noValidate
      aria-labelledby="income-form-title">
      <Stack $gap="md">
        <Text as="h2" id="income-form-title" variant="title">
          {income ? t('income_edit_title') : t('income_new_title')}
        </Text>

        <Field
          label={t('income_day')}
          htmlFor="income-day"
          error={errorText('day')}>
          <DateInput
            id="income-day"
            value={draft.day}
            max={today}
            aria-invalid={Boolean(errors.day)}
            onChange={event =>
              update({ day: event.target.value, rateManual: false })
            }
          />
        </Field>

        <Field label={t('income_currency')}>
          <Segmented
            label={t('income_currency')}
            options={CURRENCIES.map(value => ({ value, label: value }))}
            selected={[draft.currency]}
            onSelect={currency =>
              update({
                currency,
                rate: '',
                rateManual: false,
                uahManual: false,
                uah: '',
              })
            }
          />
        </Field>

        <Field
          label={t('income_amount', { currency: draft.currency })}
          htmlFor="income-amount"
          error={errorText('amount')}>
          <TextInput
            id="income-amount"
            inputMode="decimal"
            autoComplete="off"
            value={draft.amount}
            aria-invalid={Boolean(errors.amount)}
            onChange={event => update({ amount: event.target.value })}
          />
        </Field>

        {foreign ? (
          <Field
            label={t('income_rate', { currency: draft.currency })}
            htmlFor="income-rate"
            error={errorText('rate')}>
            <TextInput
              id="income-rate"
              inputMode="decimal"
              autoComplete="off"
              value={shown.rate}
              aria-invalid={Boolean(errors.rate)}
              onChange={event =>
                update({ rate: event.target.value, rateManual: true })
              }
            />
            <Text variant="caption" tone="muted">
              {rateHint()}
            </Text>
          </Field>
        ) : null}

        {foreign ? (
          <Field
            label={t('income_uah')}
            htmlFor="income-uah"
            error={errorText('uah')}>
            <TextInput
              id="income-uah"
              inputMode="decimal"
              autoComplete="off"
              value={draft.uahManual ? draft.uah : computedText}
              aria-invalid={Boolean(errors.uah)}
              onChange={event =>
                update({ uah: event.target.value, uahManual: true })
              }
            />
            {draft.uahManual ? (
              <Button
                variant="ghost"
                onClick={() => update({ uahManual: false, uah: '' })}>
                {t('income_uah_reset')}
              </Button>
            ) : (
              <Text variant="caption" tone="muted">
                {t('income_uah_hint')}
              </Text>
            )}
          </Field>
        ) : null}

        {shownUah !== null && rates && percent !== null ? (
          <Preview>
            <PreviewRow>
              <Text variant="secondary" tone="muted">
                {t('income_preview_income')}
              </Text>
              <Text variant="amountSmall">
                {t('money_uah', { amount: formatMoney(shownUah) })}
              </Text>
            </PreviewRow>
            <PreviewRow>
              <Text variant="secondary" tone="muted">
                {t('income_preview_tax', { percent })}
              </Text>
              <Text variant="secondary">
                {formatMoney(percentOf(shownUah, percent))}
              </Text>
            </PreviewRow>
            {rates.levyPercent > 0 ? (
              <PreviewRow>
                <Text variant="secondary" tone="muted">
                  {t('income_preview_levy', { percent: rates.levyPercent })}
                </Text>
                <Text variant="secondary">
                  {formatMoney(percentOf(shownUah, rates.levyPercent))}
                </Text>
              </PreviewRow>
            ) : null}
            {quarterLine() ? (
              <Text variant="caption" tone="muted">
                {quarterLine()}
              </Text>
            ) : null}
          </Preview>
        ) : null}

        <Field
          label={t('income_note')}
          htmlFor="income-note"
          error={errorText('note')}>
          <TextInput
            id="income-note"
            autoComplete="off"
            placeholder={t('income_note_placeholder')}
            value={draft.note}
            aria-invalid={Boolean(errors.note)}
            onChange={event => update({ note: event.target.value })}
          />
        </Field>

        <Row>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            stretch
            disabled={pending}>
            {t('action_save')}
          </Button>
          <Button size="lg" onClick={onClose}>
            {t('action_cancel')}
          </Button>
        </Row>

        {onDelete && !confirming ? (
          <Button
            variant="danger"
            icon="trash"
            onClick={() => setConfirming(true)}>
            {t('income_delete')}
          </Button>
        ) : null}
        {onDelete && confirming ? (
          <Stack $gap="xs">
            <Text variant="secondary">{t('income_delete_confirm')}</Text>
            <Row>
              <Button variant="danger" onClick={onDelete}>
                {t('income_delete_yes')}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                {t('action_cancel')}
              </Button>
            </Row>
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}
