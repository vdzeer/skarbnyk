import styled from 'styled-components'

import { narrow } from '~/themes'

export const Page = styled.div`
  display: flex;
  flex-wrap: wrap;
  min-height: 100vh;
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.background};
`

export const Pitch = styled.section`
  flex: 1 1 ${({ theme }) => theme.sizes.pitch};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: clamp(
      ${({ theme }) => theme.spacing.lg},
      5vw,
      ${({ theme }) => theme.spacing.xxxl}
    )
    clamp(
      ${({ theme }) => theme.spacing.md},
      5vw,
      ${({ theme }) => theme.spacing.xxxl}
    );
  padding-top: calc(
    clamp(
        ${({ theme }) => theme.spacing.lg},
        5vw,
        ${({ theme }) => theme.spacing.xxxl}
      ) +
      ${({ theme }) => theme.insets.top}
  );
  background: ${({ theme }) => theme.colors.hero};
  color: ${({ theme }) => theme.colors.onHero};

  h1 {
    max-width: ${({ theme }) => theme.sizes.pitch};
  }

  ${narrow} {
    gap: ${({ theme }) => theme.spacing.md};
  }
`

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const Points = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: ${({ theme }) => theme.sizes.pitch};
  margin: 0;
  padding: 0;
  list-style: none;

  ${narrow} {
    display: none;
  }
`

export const Point = styled.li`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};

  svg {
    color: ${({ theme }) => theme.colors.onHeroMuted};
  }
`

export const Panel = styled.main`
  flex: 1 1 ${({ theme }) => theme.sizes.columnWide};
  display: flex;
  justify-content: center;
  min-width: 0;
  padding: clamp(
      ${({ theme }) => theme.spacing.lg},
      5vw,
      ${({ theme }) => theme.spacing.xxxl}
    )
    max(
      ${({ theme }) => theme.spacing.md},
      ${({ theme }) => theme.insets.right}
    )
    calc(
      ${({ theme }) => theme.spacing.xl} + ${({ theme }) => theme.insets.bottom}
    )
    max(${({ theme }) => theme.spacing.md}, ${({ theme }) => theme.insets.left});
`

export const Slot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.signInPanel};
`
