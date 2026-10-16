import styled from 'styled-components'

export const Group = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.xxs};
  padding: ${({ theme }) => theme.spacing.xxs};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background};
`

export const Option = styled.button<{ $selected: boolean }>`
  min-height: ${({ theme }) => theme.sizes.segment};
  padding: ${({ theme }) => theme.spacing.xxs}
    ${({ theme }) => theme.spacing.xs};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary : 'transparent'};
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.onPrimary : theme.colors.onSurface};
  font-size: ${({ theme }) => theme.text.secondary.size};
  line-height: ${({ theme }) => theme.text.secondary.line};
  font-weight: ${({ theme, $selected }) =>
    $selected ? theme.text.label.weight : theme.text.secondary.weight};
  cursor: pointer;
`
