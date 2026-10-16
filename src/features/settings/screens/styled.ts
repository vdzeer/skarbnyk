import styled from 'styled-components'

import { narrow } from '~/themes'

/** Stays in view at the bottom while there is something to save. */
export const SaveBar = styled.div`
  position: sticky;
  bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};

  > :first-child {
    flex: 1 1 auto;
  }

  ${narrow} {
    bottom: calc(
      ${({ theme }) => theme.sizes.tabBar} +
        ${({ theme }) => theme.spacing.md} +
        ${({ theme }) => theme.insets.bottom}
    );
  }
`
