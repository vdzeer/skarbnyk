import type { Income } from '~/core'
import { formatRate } from '~/services/format'

/** Kopecks as a spreadsheet reads them: no grouping, a decimal comma. */
const plain = (kop: number) => (kop / 100).toFixed(2).replace('.', ',')

/**
 * A spreadsheet runs a cell that starts with one of these as a formula. Only
 * text cells (the header and the note) go through here; the number columns
 * are written by `plain` and keep their minus sign.
 */
const FORMULA_START = /^[=+\-@\t\r]/

/** A quoted text cell; a would-be formula gets a leading `'` and stays text. */
const text = (value: string) => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

/**
 * The incomes as a CSV that Excel opens in Ukrainian settings: semicolons
 * between fields, decimal commas, and a byte-order mark so Cyrillic survives.
 */
export const incomesCsv = (incomes: Income[], header: string[]) =>
  `﻿${[
    header.map(text).join(';'),
    ...[...incomes]
      .sort((one, other) => one.day.localeCompare(other.day))
      .map(income =>
        [
          income.day,
          plain(income.amount),
          income.currency,
          income.rate === null
            ? ''
            : formatRate(income.rate).replace(/\s/g, ''),
          plain(income.uah),
          text(income.note),
        ].join(';'),
      ),
  ].join('\r\n')}\r\n`
