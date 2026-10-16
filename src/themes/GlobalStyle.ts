import { createGlobalStyle } from 'styled-components'

import { paletteCss } from './tokens'

export const GlobalStyle = createGlobalStyle`
  /* Light unless the system or the user says otherwise. The attribute is set
     before the first paint (see the script in the root layout), so a dark
     page never flashes light. */
  :root {
    ${paletteCss('light')}
    color-scheme: light;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      ${paletteCss('dark')}
      color-scheme: dark;
    }
  }

  :root[data-theme='dark'] {
    ${paletteCss('dark')}
    color-scheme: dark;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  html {
    /* A phone turned sideways must not blow the text up on its own. */
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.onSurface};
    font-family: ${({ theme }) => theme.text.body.family};
    font-size: ${({ theme }) => theme.text.body.size};
    line-height: ${({ theme }) => theme.text.body.line};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  button,
  input,
  select {
    font: inherit;
    color: inherit;
  }

  :focus-visible {
    outline: ${({ theme }) => theme.spacing.xxs} solid
      ${({ theme }) => theme.colors.focus};
    outline-offset: ${({ theme }) => theme.sizes.hairline};
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
`
