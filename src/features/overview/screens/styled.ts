import styled from 'styled-components'

export const Note = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.onSurface};

  svg {
    color: ${({ theme }) => theme.colors.warning};
  }
`

export const Privacy = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  color: ${({ theme }) => theme.colors.onSurfaceMuted};
`
