import { passwordProblem, passwordStrength } from '../password'

describe('passwordProblem', () => {
  it('asks for twelve characters', () => {
    expect(passwordProblem('short', 'short')).toBe('short')
    expect(passwordProblem('a'.repeat(11), 'a'.repeat(11))).toBe('short')
  })

  it('asks for the same password twice', () => {
    expect(passwordProblem('a'.repeat(12), 'b'.repeat(12))).toBe('mismatch')
  })

  it('accepts a long password typed twice, Cyrillic included', () => {
    expect(
      passwordProblem('скарбник береже гроші', 'скарбник береже гроші'),
    ).toBeNull()
  })
})

describe('passwordStrength', () => {
  it('is empty for nothing and weak below the floor', () => {
    expect(passwordStrength('')).toBe(0)
    expect(passwordStrength('Abc123!')).toBe(1)
  })

  it('grows with variety and length', () => {
    expect(passwordStrength('aaaaaaaaaaaa')).toBe(2)
    expect(passwordStrength('aaaaaaaaaaa1')).toBe(3)
    expect(passwordStrength('Aaaaaaaaaaa1')).toBe(4)
    expect(passwordStrength('a'.repeat(20))).toBe(4)
  })
})
