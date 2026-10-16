import { queryLoadState } from '../queryState'

describe('queryLoadState', () => {
  it('is ready only when every query has its data', () => {
    expect(queryLoadState([{ status: 'success' }, { status: 'success' }])).toBe(
      'ready',
    )
  })

  it('is loading while any query is still waiting', () => {
    expect(queryLoadState([{ status: 'success' }, { status: 'pending' }])).toBe(
      'loading',
    )
  })

  it('reports an error ahead of loading, so a failure is never a spinner', () => {
    expect(queryLoadState([{ status: 'pending' }, { status: 'error' }])).toBe(
      'error',
    )
  })

  it('treats a query that never started as loading, not as empty', () => {
    // A disabled query (no user yet) stays `pending`.
    expect(queryLoadState([{ status: 'pending' }])).toBe('loading')
  })
})
