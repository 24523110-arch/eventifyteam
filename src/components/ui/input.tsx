import * as React from 'react'
import { cn } from '@/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('input-glass', error && 'border-status-danger/60 focus:border-status-danger/60', className)}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
