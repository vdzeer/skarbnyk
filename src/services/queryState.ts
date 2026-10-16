/**
 * react-query reports `isLoading: false` both for a disabled query and for a
 * failed one, so a boolean would show "nothing here" to someone whose data
 * simply has not arrived. Screens ask for one of three states instead.
 */
export type LoadState = 'loading' | 'error' | 'ready'

type QueryLike = { status: 'pending' | 'error' | 'success' }

export const queryLoadState = (queries: QueryLike[]): LoadState => {
  if (queries.some(query => query.status === 'error')) return 'error'
  if (queries.some(query => query.status === 'pending')) return 'loading'
  return 'ready'
}
