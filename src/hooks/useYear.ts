import { yearOf } from '~/core'
import { useViewStore } from '~/store'

import { useToday } from './useToday'

/** The tax year the screens show, shared between them; this year by default. */
export const useYear = () => {
  const today = useToday()
  const chosen = useViewStore(state => state.year)
  const setYear = useViewStore(state => state.setYear)
  const current = yearOf(today)

  return {
    today,
    year: chosen ?? current,
    setYear: (year: number) => setYear(year === current ? null : year),
  }
}
