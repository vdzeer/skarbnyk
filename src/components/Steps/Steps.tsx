import { useT } from '~/services/i18n'

import { Icon } from '../Icon'

import { List, Step } from './styled'

const stateOf = (number: number, current: number) => {
  if (number < current) return 'done'
  return number === current ? 'now' : 'ahead'
}

type Props = {
  /** 1-based: which of the steps is on screen now. */
  current: number
  labels: string[]
}

/** Where the user is in a short setup: done, now, still ahead. */
export const Steps = ({ current, labels }: Props) => {
  const t = useT()

  return (
    <List aria-label={t('steps_label')}>
      {labels.map((label, index) => {
        const number = index + 1
        const state = stateOf(number, current)
        return (
          <Step
            key={label}
            $state={state}
            aria-current={state === 'now' ? 'step' : undefined}>
            {state === 'done' ? <Icon name="check" size="sm" /> : null}
            {state === 'done' ? label : t('steps_item', { number, label })}
          </Step>
        )
      })}
    </List>
  )
}
