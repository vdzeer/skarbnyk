import { create } from 'zustand'

type ViewState = {
  /** The tax year the screens show; null follows the current year. */
  year: number | null
  setYear: (year: number | null) => void
  /** Set before moving to Incomes so the form opens there for a new entry. */
  draftRequested: boolean
  requestDraft: (requested: boolean) => void
}

export const useViewStore = create<ViewState>(set => ({
  year: null,
  setYear: year => set({ year }),
  draftRequested: false,
  requestDraft: draftRequested => set({ draftRequested }),
}))
