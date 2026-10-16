/** Long beats clever: twelve characters is the floor, nothing else is forced. */
export const MIN_PASSWORD_LENGTH = 12

export type PasswordProblem = 'short' | 'mismatch' | null

export const passwordProblem = (
  password: string,
  repeat: string,
): PasswordProblem => {
  if (password.length < MIN_PASSWORD_LENGTH) return 'short'
  if (password !== repeat) return 'mismatch'
  return null
}

/**
 * A rough strength, 0…4, for the bar under the field: length and variety.
 * It only nudges; the length floor is the one rule.
 */
export const passwordStrength = (password: string) => {
  const kinds = [/[a-zа-яіїєґ]/, /[A-ZА-ЯІЇЄҐ]/, /\d/, /[^\p{L}\d]/u].filter(
    pattern => pattern.test(password),
  ).length
  if (password.length < MIN_PASSWORD_LENGTH) return password ? 1 : 0
  if (password.length >= 20 || kinds >= 3) return 4
  return kinds >= 2 ? 3 : 2
}
