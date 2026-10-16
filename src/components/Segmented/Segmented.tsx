import { Group, Option } from './styled'

type Props<Value extends string | number> = {
  label: string
  options: { value: Value; label: string }[]
  /** A single value, or several when `multiple` is set. */
  selected: Value[]
  onSelect: (value: Value) => void
}

/** A row of mutually visible choices. The selected one is filled, not just tinted. */
export const Segmented = <Value extends string | number>({
  label,
  options,
  selected,
  onSelect,
}: Props<Value>) => (
  <Group role="group" aria-label={label} $count={options.length}>
    {options.map(option => {
      const isSelected = selected.includes(option.value)
      return (
        <Option
          key={option.value}
          type="button"
          aria-pressed={isSelected}
          $selected={isSelected}
          onClick={() => onSelect(option.value)}>
          {option.label}
        </Option>
      )
    })}
  </Group>
)
