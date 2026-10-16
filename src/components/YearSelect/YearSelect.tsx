import { useT } from '~/services/i18n'

import { SelectInput } from '../Field'

import { Label } from './styled'

type Props = {
  years: number[]
  value: number
  onChange: (year: number) => void
}

/** Which tax year a screen shows. */
export const YearSelect = ({ years, value, onChange }: Props) => {
  const t = useT()

  return (
    <Label>
      {t('year_label')}
      <SelectInput
        value={value}
        onChange={event => onChange(Number(event.target.value))}>
        {years.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </SelectInput>
    </Label>
  )
}
