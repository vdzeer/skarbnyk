import styled from 'styled-components'

import { narrow } from '~/themes'

/** Vertical rhythm for a page or a card. */
export const Stack = styled.div<{
  $gap?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $gap = 'md' }) => theme.spacing[$gap]};
  min-width: 0;
`

/** A row that wraps instead of overflowing on a narrow screen. */
export const Row = styled.div<{
  $gap?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg'
  $align?: 'center' | 'baseline' | 'flex-start' | 'flex-end'
  $justify?: 'space-between' | 'flex-start' | 'flex-end' | 'center'
  $nowrap?: boolean
}>`
  display: flex;
  flex-wrap: ${({ $nowrap }) => ($nowrap ? 'nowrap' : 'wrap')};
  align-items: ${({ $align = 'center' }) => $align};
  justify-content: ${({ $justify = 'flex-start' }) => $justify};
  gap: ${({ theme, $gap = 'sm' }) => theme.spacing[$gap]};
  min-width: 0;
`

/** Takes the free space in a Row and lets its text wrap. */
export const Grow = styled.div`
  flex: 1 1 0;
  min-width: 0;
`

/** Two columns that stack once there is no room for both. */
export const Columns = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg};
`

export const ColumnWide = styled.div`
  flex: 2 1 ${({ theme }) => theme.sizes.columnWide};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  min-width: 0;
`

export const ColumnNarrow = styled.div`
  flex: 1 1 ${({ theme }) => theme.sizes.columnNarrow};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
`

export const PageHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

/** The list half of a "pick on the left, edit on the right" screen. */
export const ListColumn = styled.div`
  flex: 2 1 ${({ theme }) => theme.sizes.columnWide};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;
`

/* Beside the list the editor follows the scroll, so it is in view whichever
   row was picked. On a phone it opens above the list instead. */
export const EditorColumn = styled.div<{ $open: boolean }>`
  position: sticky;
  top: ${({ theme }) => theme.spacing.lg};
  flex: 1 1 ${({ theme }) => theme.sizes.columnNarrow};
  min-width: 0;
  max-height: calc(100dvh - 2 * ${({ theme }) => theme.spacing.lg});
  overflow-y: auto;
  scroll-margin-top: calc(
    ${({ theme }) => theme.spacing.lg} + ${({ theme }) => theme.insets.top}
  );

  ${narrow} {
    position: static;
    order: -1;
    display: ${({ $open }) => ($open ? 'block' : 'none')};
    max-height: none;
    overflow-y: visible;
  }
`

/** For what only a phone needs, such as a way back that a side menu replaces. */
export const NarrowOnly = styled.div`
  display: none;

  ${narrow} {
    display: flex;
  }
`
