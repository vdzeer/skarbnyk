import type { DayKey, Group, Profile } from '~/core'
import { EMPTY_REQUISITES } from '~/features/ledger/services'

/** The profile the first setup writes: the law's numbers, minimum ЄСВ. */
export const newProfile = (input: {
  /** Payments are tracked from the day of the first setup. */
  today: DayKey
  registeredOn: DayKey
  groupFrom: DayKey
  group: Group
  vat: boolean
}): Profile => ({
  registeredOn: input.registeredOn,
  trackFrom: input.today,
  periods: [
    {
      from:
        input.groupFrom < input.registeredOn
          ? input.registeredOn
          : input.groupFrom,
      group: input.group,
      vat: input.group === 3 && input.vat,
    },
  ],
  esv: { mode: 'minimum', monthly: 0, exemption: null, since: null },
  service: null,
  paySchedule: 'quarterly',
  monthlySince: '',
  overrides: {},
  requisites: EMPTY_REQUISITES,
})
