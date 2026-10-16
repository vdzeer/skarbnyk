import { Fill, Track } from './styled'

type Props = {
  /** 0…1 */
  ratio: number
  color: string
  label: string
  large?: boolean
}

export const ProgressBar = ({ ratio, color, label, large = false }: Props) => {
  const safe = Math.min(1, Math.max(0, ratio))

  return (
    <Track
      $large={large}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe * 100)}>
      <Fill $ratio={safe} $color={color} />
    </Track>
  )
}
