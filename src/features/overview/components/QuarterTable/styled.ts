import styled from 'styled-components'

/** A table keeps its columns and scrolls sideways on a phone. */
export const Scroll = styled.div`
  overflow-x: auto;
`

export const Table = styled.table`
  width: 100%;
  min-width: ${({ theme }) => theme.sizes.table};
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;

  th,
  td {
    padding: ${({ theme }) => theme.spacing.sm};
    text-align: right;
    font-size: ${({ theme }) => theme.text.body.size};
    line-height: ${({ theme }) => theme.text.body.line};
  }

  th:first-child,
  th:last-child,
  td:last-child {
    text-align: left;
  }

  th:first-child {
    padding-left: 0;
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

  tfoot tr {
    border-top: ${({ theme }) => theme.sizes.thick} solid
      ${({ theme }) => theme.colors.onSurface};
    font-weight: ${({ theme }) => theme.text.bodyStrong.weight};
  }
`

/** The quarter's name doubles as the button that opens its months. */
export const Toggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-height: ${({ theme }) => theme.sizes.control};
  margin-left: calc(-1 * ${({ theme }) => theme.spacing.xxs});
  padding: 0 ${({ theme }) => theme.spacing.xs} 0
    ${({ theme }) => theme.spacing.xxs};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.onSurface};
  font-weight: ${({ theme }) => theme.text.bodyStrong.weight};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceSubtle};
  }

  svg {
    color: ${({ theme }) => theme.colors.onSurfaceMuted};
  }
`

/** A month under its quarter: quieter, indented, on a tinted band. */
export const MonthRow = styled.tr`
  background: ${({ theme }) => theme.colors.surfaceSubtle};
  color: ${({ theme }) => theme.colors.onSurfaceMuted};

  && th,
  && td {
    padding-top: ${({ theme }) => theme.spacing.xs};
    padding-bottom: ${({ theme }) => theme.spacing.xs};
    font-size: ${({ theme }) => theme.text.secondary.size};
    line-height: ${({ theme }) => theme.text.secondary.line};
  }

  && th {
    padding-left: ${({ theme }) => theme.spacing.xl};
    font-weight: ${({ theme }) => theme.text.secondary.weight};
  }

  && th::first-letter {
    text-transform: uppercase;
  }
`

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

/** The month's payment panel, the full width of the table. */
export const PanelRow = styled.tr`
  background: ${({ theme }) => theme.colors.surfaceSubtle};

  && td {
    padding-top: 0;
  }
`
