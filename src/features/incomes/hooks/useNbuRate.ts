import { useQuery } from '@tanstack/react-query'

import { isDayKey, type Currency, type DayKey } from '~/core'
import { fetchNbuRate } from '~/services/nbu'

/** The NBU rate for a currency on a day; a rate never changes, so it is kept. */
export const useNbuRate = (currency: Currency, day: DayKey, today: DayKey) =>
  useQuery({
    queryKey: ['nbu', currency, day],
    queryFn: () => fetchNbuRate(currency as Exclude<Currency, 'UAH'>, day),
    enabled: currency !== 'UAH' && isDayKey(day) && day <= today,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
