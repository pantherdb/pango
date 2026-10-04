import { Loader } from '@mantine/core'
import type { ReactNode } from 'react'

export const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] break-all text-gray-800">
    {children}
  </code>
)

export const EmptyState = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
    <p className="m-0 font-medium text-gray-800">{title}</p>
    {children && <div className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">{children}</div>}
  </div>
)

const errorText = (error: unknown): string => {
  if (!error) return 'No answer from the dashboard server.'
  if (typeof error === 'object' && error !== null) {
    const { status, data } = error as { status?: unknown; data?: unknown }
    const message = (data as { error?: string } | undefined)?.error
    if (message) return message
    if (status === 'FETCH_ERROR') return 'The dashboard server did not answer.'
    if (status !== undefined) return `HTTP ${String(status)}`
  }
  return error instanceof Error ? error.message : String(error)
}

export const ErrorNotice = ({ title, error }: { title: string; error?: unknown }) => (
  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
    <p className="m-0 font-medium">{title}</p>
    <p className="m-0 mt-1">{errorText(error)}</p>
  </div>
)

export const Loading = ({ what }: { what: string }) => (
  <div className="flex items-center gap-2 p-6 text-sm text-gray-600">
    <Loader size="xs" />
    Loading {what}…
  </div>
)

/** Label–value pairs, for process, config and provenance. */
export const KeyValues = ({ items }: { items: [string, ReactNode][] }) => (
  <dl className="m-0 grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-1 text-sm">
    {items.map(([key, value]) => (
      <div key={key} className="contents">
        <dt className="text-gray-500">{key}</dt>
        <dd className="m-0 min-w-0 break-words text-gray-900">{value}</dd>
      </div>
    ))}
  </dl>
)
