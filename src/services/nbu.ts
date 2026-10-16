import type { Currency, DayKey } from '~/core'

/**
 * The official NBU rate on a day: what the Tax Code converts foreign income
 * at (ПКУ 292.5). The NBU API answers browsers directly (CORS is open), so no
 * server is involved; the request names only a currency and a date.
 */

const ENDPOINT = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange'

export const nbuUrl = (currency: Exclude<Currency, 'UAH'>, day: DayKey) =>
  `${ENDPOINT}?valcode=${currency}&date=${day.replace(/-/g, '')}&json`

/** The rate from the API's answer, or null if it is not one. */
export const rateFromResponse = (data: unknown): number | null => {
  if (!Array.isArray(data) || data.length === 0) return null
  const { rate } = data[0] as { rate?: unknown }
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0
    ? rate
    : null
}

export const fetchNbuRate = async (
  currency: Exclude<Currency, 'UAH'>,
  day: DayKey,
): Promise<number> => {
  const response = await fetch(nbuUrl(currency, day))
  if (!response.ok) throw new Error(`NBU answered ${response.status}`)
  const rate = rateFromResponse(await response.json())
  if (rate === null) throw new Error('NBU sent no rate')
  return rate
}
