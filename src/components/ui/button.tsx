import * as React from 'react'
import { cn } from '@/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  ghost: 'glass text-ink-muted hover:border-primary/30',
  danger: 'glass text-status-danger hover:border-status-danger/40 hover:bg-status-danger/10',
}

const SIZE_CLASS: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'rounded-xl font-medium transition-all duration-200 inline-flex items-center gap-1.5 justify-center disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button }
