import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark'
type Size = 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base = 'inline-flex items-center justify-center font-medium tracking-wider uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:   'bg-charcoal text-white hover:bg-charcoal/90 rounded-none',
  secondary: 'bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-white rounded-none',
  ghost:     'bg-transparent text-slate hover:text-charcoal rounded-none',
  dark:      'bg-[#DC3545] text-white hover:bg-[#c82333] rounded-lg',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 px-6 text-[11px] gap-2 tracking-[0.15em]',
  md: 'h-12 px-8 text-[12px] gap-2.5 tracking-[0.15em]',
  lg: 'h-14 px-10 text-[13px] gap-3 tracking-[0.2em]',
}

export default function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...rest }: Props) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
