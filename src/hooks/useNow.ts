import { useEffect, useState } from 'react'

/**
 * The current time, refreshed on an interval. Components read the clock
 * through this rather than calling `Date.now()` while rendering, so a render
 * stays a pure function of its inputs.
 */
export const useNow = (intervalMs: number) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
