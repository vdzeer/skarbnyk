'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

import { AuthGate } from '~/features/auth/components'
import { useThemeSync } from '~/hooks'

type Props = {
  children: ReactNode
}

export const AppProviders = ({ children }: Props) => {
  useThemeSync()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>{children}</AuthGate>
    </QueryClientProvider>
  )
}
