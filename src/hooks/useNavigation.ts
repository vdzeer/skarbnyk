import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { ROUTES } from '~/types'

/** The one way screens move between routes. */
export const useNavigation = () => {
  const router = useRouter()

  return useMemo(
    () => ({
      go: (route: ROUTES) => router.push(route),
      replace: (route: ROUTES) => router.replace(route),
    }),
    [router],
  )
}
