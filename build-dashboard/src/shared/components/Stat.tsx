import type { ReactNode } from 'react'

const TONES = {
  default: 'text-gray-900',
  good: 'text-green-800',
  warn: 'text-amber-800',
  bad: 'text-red-700',
  muted: 'text-gray-400',
} as const

export interface StatProps {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: keyof typeof TONES
}

/** One headline figure with its label. */
export const Stat = ({ label, value, hint, tone = 'default' }: StatProps) => (
  <div className="min-w-[7rem]">
    <div className="text-2xs font-medium tracking-wide text-gray-500 uppercase">{label}</div>
    <div className={`figures text-lg leading-tight font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {value}
    </div>
    {hint && <div className="text-xs text-gray-500">{hint}</div>}
  </div>
)

export const StatRow = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap gap-x-6 gap-y-3">{children}</div>
)
