import { Field, Text, TextInput } from '~/components'
import { useT, type TranslationKey } from '~/services/i18n'

import {
  MIN_PASSWORD_LENGTH,
  passwordStrength,
  type PasswordProblem,
} from '../../services'

import { Meter, Segment } from './styled'

const STRENGTH_LABEL: TranslationKey[] = [
  'password_strength_0',
  'password_strength_1',
  'password_strength_2',
  'password_strength_3',
  'password_strength_4',
]

type Props = {
  password: string
  repeat: string
  onPassword: (value: string) => void
  onRepeat: (value: string) => void
  /** Shown once the user has tried to submit. */
  problem: PasswordProblem
}

/** A new password typed twice, with a strength bar under the first field. */
export const NewPasswordFields = ({
  password,
  repeat,
  onPassword,
  onRepeat,
  problem,
}: Props) => {
  const t = useT()
  const strength = passwordStrength(password)

  return (
    <>
      <Field
        label={t('password_new_label', { count: MIN_PASSWORD_LENGTH })}
        htmlFor="new-password"
        error={problem === 'short' ? t('password_short') : undefined}>
        <TextInput
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          aria-invalid={problem === 'short'}
          onChange={event => onPassword(event.target.value)}
        />
      </Field>
      <Meter
        role="img"
        aria-label={t(STRENGTH_LABEL[strength])}
        $strength={strength}>
        {[1, 2, 3, 4].map(step => (
          <Segment key={step} $on={step <= strength} />
        ))}
      </Meter>
      {password ? (
        <Text variant="caption" tone="muted">
          {t(STRENGTH_LABEL[strength])}
        </Text>
      ) : null}
      <Field
        label={t('password_repeat_label')}
        htmlFor="repeat-password"
        error={problem === 'mismatch' ? t('password_mismatch') : undefined}>
        <TextInput
          id="repeat-password"
          type="password"
          autoComplete="new-password"
          value={repeat}
          aria-invalid={problem === 'mismatch'}
          onChange={event => onRepeat(event.target.value)}
        />
      </Field>
    </>
  )
}
