import styled from 'styled-components'

export const Item = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};

  &:first-child {
    border-top: none;
  }
`

export const Body = styled.div`
  flex: 1 1 ${({ theme }) => theme.sizes.field};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
`

export const Side = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.xs};
`

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  align-self: stretch;
`

export const Numbers = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceSubtle};
  font-variant-numeric: tabular-nums;

  dt {
    color: ${({ theme }) => theme.colors.onSurfaceMuted};
  }

  dd {
    margin: 0;
    font-weight: ${({ theme }) => theme.text.bodyStrong.weight};
    text-align: right;
  }
`
