import styled, { css } from 'styled-components'

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
`

const control = css`
  width: 100%;
  min-width: 0;
  min-height: ${({ theme }) => theme.sizes.control};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.onSurface};

  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.colors.danger};
  }
`

export const TextInput = styled.input`
  ${control}
`

export const NumberInput = styled.input`
  ${control}
  flex: none;
  width: ${({ theme }) => theme.sizes.numberField};
`

export const SelectInput = styled.select`
  ${control}
`

/** A calendar day; the browser supplies the picker. */
export const DateInput = styled.input.attrs({ type: 'date' })`
  ${control}
  flex: none;
  width: auto;
`
