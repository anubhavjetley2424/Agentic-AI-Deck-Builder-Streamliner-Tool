import { cn } from '../../lib/utils'

export default function Container({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} {...rest}>
      {children}
    </div>
  )
}
