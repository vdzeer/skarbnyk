import styled from 'styled-components'

export const Scroll = styled.div`
  overflow-x: auto;
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;

  th,
  td {
    padding: ${({ theme }) => theme.spacing.xs};
    text-align: left;
    vertical-align: top;
    font-size: ${({ theme }) => theme.text.secondary.size};
    line-height: ${({ theme }) => theme.text.secondary.line};
  }

  th:first-child {
    padding-left: 0;
  }

  tbody th {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.xxs};
    font-weight: inherit;
  }

  thead th {
    color: ${({ theme }) => theme.colors.onSurfaceMuted};
    font-size: ${({ theme }) => theme.text.caption.size};
    font-weight: ${({ theme }) => theme.text.label.weight};
  }

  tbody tr {
    border-top: ${({ theme }) => theme.sizes.hairline} solid
      ${({ theme }) => theme.colors.border};
  }

  tbody tr[aria-current='true'] {
    background: ${({ theme }) => theme.colors.surfaceSubtle};
  }
`
