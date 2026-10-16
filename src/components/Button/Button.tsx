import type { ReactNode } from 'react'

import { Icon, type IconName } from '../Icon'

import { StyledButton, StyledLink } from './styled'
import type { ButtonSize, ButtonVariant } from './types'

type Props = {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  /** Fill the row instead of hugging the label. */
  stretch?: boolean
  /** Renders a link that looks like a button. */
  href?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  'aria-label'?: string
  'aria-pressed'?: boolean
  children?: ReactNode
}

export const Button = ({
  variant = 'secondary',
  size = 'md',
  icon,
  stretch = false,
  href,
  type = 'button',
  children,
  ...rest
}: Props) => {
  const style = { $variant: variant, $size: size, $stretch: stretch }
  const content = (
    <>
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </>
  )

  if (href) {
    return (
      <StyledLink href={href} aria-label={rest['aria-label']} {...style}>
        {content}
      </StyledLink>
    )
  }

  return (
    <StyledButton type={type} {...style} {...rest}>
      {content}
    </StyledButton>
  )
}
