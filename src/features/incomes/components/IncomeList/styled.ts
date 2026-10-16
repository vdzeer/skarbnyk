import styled from 'styled-components'

export const Scroll = styled.div`
  overflow-x: auto;
`

export const Table = styled.table`
  width: 100%;
  min-width: ${({ theme }) => theme.sizes.tableNarrow};
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;

  th,
  td {
    padding: ${({ theme }) => theme.spacing.xs}
      ${({ theme }) => theme.spacing.sm};
    text-align: right;
    font-size: ${({ theme }) => theme.text.body.size};
    line-height: ${({ theme }) => theme.text.body.line};
  }

  th:first-child,
  td:first-child {
    padding-left: 0;
    text-align: left;
  }

  th:nth-child(5),
  td:nth-child(5) {
    text-align: left;
    color: ${({ theme }) => theme.colors.onSurfaceMuted};
  }

  th:last-child,
  td:last-child {
    width: ${({ theme }) => theme.sizes.control};
    padding-right: 0;
  }

  thead th {
    color: ${({ theme }) => theme.colors.onSurfaceMuted};
    font-size: ${({ theme }) => theme.text.caption.size};
    font-weight: ${({ theme }) => theme.text.label.weight};
  }

  tbody tr {
    border-top: ${({ theme }) => theme.sizes.hairline} solid
      ${({ theme }) => theme.colors.border};
    cursor: pointer;
  }

  tbody tr:hover,
  tbody tr[aria-selected='true'] {
    background: ${({ theme }) => theme.colors.surfaceSubtle};
  }
`
