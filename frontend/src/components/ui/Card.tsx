import { cn } from '../../lib/utils'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  warm?: boolean
}

export default function Card({ hover = false, warm = false, children, className, ...rest }: Props) {
  return (
    <div
      className={cn(
        'rounded-card border border-border/60 p-8',
        warm ? 'bg-surface-warm' : 'bg-white',
        hover && 'transition-all duration-300 hover:shadow-lift hover:-translate-y-1 cursor-pointer',
        !hover && 'shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
