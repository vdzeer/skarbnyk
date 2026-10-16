'use client'

import { useEffect, useRef, useState } from 'react'

import {
  Button,
  EditorColumn,
  ListColumn,
  Columns,
  PageHeader,
  Row,
  Segmented,
  Stack,
  StatePanel,
  Text,
  YearSelect,
} from '~/components'
import { QUARTERS, quarterOf, yearOf, type Income, type Quarter } from '~/core'
import {
  newId,
  useLedger,
  useLedgerActions,
  useTaxes,
} from '~/features/ledger/hooks'
import { COLLECTIONS, QUARTER_NAMES } from '~/features/ledger/services'
import { useYear } from '~/hooks'
import { useT } from '~/services/i18n'
import { useViewStore } from '~/store'
import { breakpoints } from '~/themes'

import { IncomeForm, IncomeList } from '../components'

type Filter = 'all' | Quarter

/** `null`: no form open. `'new'`: an empty one. Otherwise the income edited. */
type Editing = null | 'new' | Income

/** Beside the list there is room for the form, so it stays open. */
const isWide = () =>
  !window.matchMedia(`(max-width: ${breakpoints.narrow})`).matches

export const IncomesScreen = () => {
  const t = useT()
  const { today, year, setYear } = useYear()
  const { incomes, profile } = useLedger()
  const taxes = useTaxes(today)
  const { saveIncome, deleteIncome } = useLedgerActions()
  const draftRequested = useViewStore(state => state.draftRequested)
  const requestDraft = useViewStore(state => state.requestDraft)
  const [filter, setFilter] = useState<Filter>('all')
  // The screen only renders in the browser, behind the sign-in gate, so the
  // first state can read the window and the "add income" request.
  const [editing, setEditing] = useState<Editing>(() =>
    draftRequested || isWide() ? 'new' : null,
  )
  const [round, setRound] = useState(0)
  const editorRef = useRef<HTMLDivElement>(null)

  const closeEditor = () => {
    setRound(value => value + 1)
    setEditing(isWide() ? 'new' : null)
  }

  // "Add income" on the overview landed here; the request is used up.
  useEffect(() => {
    if (draftRequested) requestDraft(false)
  }, [draftRequested, requestDraft])

  useEffect(() => {
    if (editing && editing !== 'new') {
      editorRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [editing])

  const summary = taxes.summaryOf(year)
  if (!profile || !summary) {
    return <StatePanel title={t('state_loading')} role="status" />
  }

  const ofYear = incomes
    .filter(income => yearOf(income.day) === year)
    .sort((one, other) => other.day.localeCompare(one.day))
  const quarters = [...QUARTERS]
    .reverse()
    .filter(quarter => filter === 'all' || filter === quarter)
    .map(quarter => ({
      summary: summary.quarters[quarter - 1],
      incomes: ofYear.filter(income => quarterOf(income.day) === quarter),
    }))
    .filter(group => group.incomes.length > 0)

  const current = editing && editing !== 'new' ? editing : null
  const lastGroup = profile.periods[profile.periods.length - 1]
  const percent =
    lastGroup.group === 3
      ? summary.rates.singleTaxPercent[lastGroup.vat ? 'vat' : 'base']
      : null

  const save = async (value: Omit<Income, 'id'>) => {
    await saveIncome({
      ...value,
      id: current?.id ?? newId(COLLECTIONS.incomes),
    })
    if (yearOf(value.day) !== year) setYear(yearOf(value.day))
    closeEditor()
  }

  return (
    <Stack $gap="lg">
      <PageHeader>
        <Stack $gap="xxs">
          <Text variant="secondary" tone="muted">
            {t('incomes_count', { year, count: ofYear.length })}
          </Text>
          <Text as="h1" variant="pageTitle">
            {t('nav_incomes')}
          </Text>
        </Stack>
        <Row>
          <YearSelect years={taxes.years} value={year} onChange={setYear} />
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setEditing('new')}>
            {t('income_add')}
          </Button>
        </Row>
      </PageHeader>

      <Columns>
        <ListColumn>
          <Segmented<Filter>
            label={t('incomes_filter')}
            options={[
              { value: 'all', label: t('incomes_filter_all') },
              ...QUARTERS.map(quarter => ({
                value: quarter,
                label: QUARTER_NAMES[quarter],
              })),
            ]}
            selected={[filter]}
            onSelect={setFilter}
          />
          {quarters.length === 0 ? (
            <StatePanel
              title={t('incomes_empty_title', { year })}
              text={t('incomes_empty_text')}
              actions={
                <Button
                  variant="primary"
                  icon="plus"
                  onClick={() => setEditing('new')}>
                  {t('income_add')}
                </Button>
              }
            />
          ) : (
            quarters.map(group => (
              <IncomeList
                key={group.summary.quarter}
                quarter={group.summary}
                incomes={group.incomes}
                selectedId={current?.id ?? null}
                onEdit={setEditing}
              />
            ))
          )}
        </ListColumn>
        {editing ? (
          <EditorColumn $open ref={editorRef}>
            <IncomeForm
              key={`${current?.id ?? 'new'}-${round}`}
              income={current}
              today={today}
              rates={summary.rates}
              percent={percent}
              schedule={profile.paySchedule}
              onSave={save}
              onClose={closeEditor}
              onDelete={
                current
                  ? () => {
                      deleteIncome(current.id)
                      closeEditor()
                    }
                  : null
              }
            />
          </EditorColumn>
        ) : null}
      </Columns>
    </Stack>
  )
}
