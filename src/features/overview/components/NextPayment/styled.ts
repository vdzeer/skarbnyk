import styled from 'styled-components'

export const Panel = styled.section`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.xxl};
  background: ${({ theme }) => theme.colors.hero};
  color: ${({ theme }) => theme.colors.onHero};

  h2,
  h3 {
    color: ${({ theme }) => theme.colors.onHeroMuted};
  }
`

export const Lead = styled.div`
  flex: 1 1 ${({ theme }) => theme.sizes.columnNarrow};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`

export const Amount = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.text.amountHero.family};
  font-size: ${({ theme }) => theme.text.amountHero.size};
  line-height: ${({ theme }) => theme.text.amountHero.line};
  font-weight: ${({ theme }) => theme.text.amountHero.weight};
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
`

export const Unit = styled.span`
  font-size: ${({ theme }) => theme.text.amountSmall.size};
  font-weight: ${({ theme }) => theme.text.label.weight};
`

export const Badge = styled.span<{ $overdue: boolean }>`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
  padding: ${({ theme }) => theme.spacing.xxs}
    ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $overdue }) =>
    $overdue ? theme.colors.dangerSoft : theme.colors.badge};
  color: ${({ theme, $overdue }) =>
    $overdue ? theme.colors.danger : theme.colors.onBadge};
  font-size: ${({ theme }) => theme.text.secondary.size};
  line-height: ${({ theme }) => theme.text.secondary.line};
  font-weight: ${({ theme }) => theme.text.overline.weight};
`

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.xs};
`

export const Breakdown = styled.section`
  flex: 1 1 ${({ theme }) => theme.sizes.columnNarrow};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.heroPanel};
`

export const BreakdownRow = styled.div<{ $done: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  border-bottom: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.heroLine};
  text-decoration: ${({ $done }) => ($done ? 'line-through' : 'none')};

  > span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  > span > span:last-child {
    color: ${({ theme }) => theme.colors.onHeroMuted};
  }
`

export const Total = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.xs};
`
