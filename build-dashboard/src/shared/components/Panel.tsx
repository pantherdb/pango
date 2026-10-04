import type { ReactNode } from 'react'

export interface PanelProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Controls at the right of the header. */
  actions?: ReactNode
  /** No padding round the body: for tables that run to the edges. */
  flush?: boolean
  id?: string
  children: ReactNode
}

/** A titled white card, the unit every page is built from. */
export const Panel = ({ title, subtitle, actions, flush, id, children }: PanelProps) => (
  <section id={id} className="rounded-lg border border-gray-200 bg-white shadow-xs">
    <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-gray-100 px-3 py-2">
      <h2 className="m-0 text-sm font-semibold text-gray-900">{title}</h2>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
    <div className={flush ? '' : 'p-3'}>{children}</div>
  </section>
)
