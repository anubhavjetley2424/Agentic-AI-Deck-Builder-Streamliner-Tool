interface Props {
  steps: string[]
  current: number
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <nav aria-label="Design workflow steps" className="w-full bg-surface-800 border-b border-surface-600 px-6 py-4">
      <ol className="max-w-3xl mx-auto flex items-center justify-between relative" role="list">
        {/* Background connector */}
        <div className="absolute left-0 right-0 top-4 h-px bg-surface-600 z-0 mx-8" aria-hidden="true" />
        {/* Progress fill */}
        <div
          className="absolute left-8 top-4 h-px bg-wood-500 z-0 transition-all duration-500"
          style={{ width: `${(current / (steps.length - 1)) * (100 - (16 / steps.length))}%` }}
          aria-hidden="true"
        />

        {steps.map((label, i) => {
          const done   = i < current
          const active = i === current
          return (
            <li key={label} className="flex flex-col items-center z-10 gap-2" aria-current={active ? 'step' : undefined}>
              <div
                aria-label={`Step ${i + 1}: ${label} — ${done ? 'completed' : active ? 'current' : 'upcoming'}`}
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  done   ? 'bg-wood-500 text-white' :
                  active ? 'bg-wood-400 text-white ring-2 ring-wood-600 ring-offset-2 ring-offset-surface-800' :
                           'bg-surface-600 text-wood-500',
                ].join(' ')}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span aria-hidden="true">{i + 1}</span>
                )}
              </div>
              <span
                className={[
                  'text-xs font-medium tracking-wide hidden sm:block transition-colors',
                  active ? 'text-parchment' : done ? 'text-wood-400' : 'text-wood-600',
                ].join(' ')}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
