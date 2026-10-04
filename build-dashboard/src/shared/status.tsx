import { Tooltip } from '@mantine/core'
import type { IconType } from 'react-icons'
import {
  FiAlertOctagon,
  FiAlertTriangle,
  FiCheckCircle,
  FiCircle,
  FiClock,
  FiHelpCircle,
  FiInfo,
  FiMinusCircle,
  FiPlayCircle,
  FiShield,
  FiSlash,
  FiStopCircle,
  FiXCircle,
} from 'react-icons/fi'

/**
 * The one status vocabulary: build and run health, pipeline cells, phase and check outcomes, and
 * live-check results.
 *
 * Every badge shows a word and an icon as well as a colour, so states stay apart for a
 * colour-blind reader and in print. An unknown literal is shown as itself, never coerced into a
 * known state.
 */
interface StatusStyle {
  label: string
  Icon: IconType
  tone: string
  /** The bar colour where the state is drawn as a block (timelines, the pipeline grid). */
  bar: string
  hint: string
}

const STYLES: Record<string, StatusStyle> = {
  running: {
    label: 'Running',
    Icon: FiPlayCircle,
    tone: 'bg-blue-50 text-blue-800 ring-blue-200',
    bar: 'bg-blue-500',
    hint: 'Writing its record right now.',
  },
  stale: {
    label: 'Stale',
    Icon: FiClock,
    tone: 'bg-orange-50 text-orange-800 ring-orange-200',
    bar: 'bg-orange-400',
    hint: 'Says it is running but stopped updating its record: probably killed, or the machine slept.',
  },
  ok: {
    label: 'Done',
    Icon: FiCheckCircle,
    tone: 'bg-green-50 text-green-800 ring-green-200',
    bar: 'bg-green-500',
    hint: 'Finished without problems.',
  },
  issues: {
    label: 'Done, with problems',
    Icon: FiAlertTriangle,
    tone: 'bg-amber-50 text-amber-800 ring-amber-200',
    bar: 'bg-amber-400',
    hint: 'Finished, but logged errors, failed a phase or a check, or found problems in the data.',
  },
  failed: {
    label: 'Failed',
    Icon: FiXCircle,
    tone: 'bg-red-50 text-red-800 ring-red-200',
    bar: 'bg-red-500',
    hint: 'Ended in failure.',
  },
  interrupted: {
    label: 'Interrupted',
    Icon: FiStopCircle,
    tone: 'bg-gray-100 text-gray-700 ring-gray-300',
    bar: 'bg-gray-400',
    hint: 'Stopped before it finished, usually with Ctrl-C.',
  },
  skipped: {
    label: 'Skipped',
    Icon: FiMinusCircle,
    tone: 'bg-gray-100 text-gray-600 ring-gray-200',
    bar: 'bg-gray-300',
    hint: 'Not run: there was nothing to do.',
  },
  pending: {
    label: 'Waiting',
    Icon: FiCircle,
    tone: 'bg-white text-gray-500 ring-gray-200',
    bar: 'bg-gray-200',
    hint: 'Not started yet; the build is still going.',
  },
  not_reached: {
    label: 'Never ran',
    Icon: FiSlash,
    tone: 'bg-white text-gray-500 ring-gray-300',
    bar: 'bg-gray-200',
    hint: 'The build ended before this step: an earlier step failed, or the build was stopped.',
  },
  unknown: {
    label: 'Unknown',
    Icon: FiHelpCircle,
    tone: 'bg-gray-100 text-gray-700 ring-gray-300',
    bar: 'bg-gray-400',
    hint: 'Ended without recording how.',
  },
  // Live checks
  match: {
    label: 'Matches',
    Icon: FiCheckCircle,
    tone: 'bg-green-50 text-green-800 ring-green-200',
    bar: 'bg-green-500',
    hint: 'What is live equals what the build recorded.',
  },
  differs: {
    label: 'Differs',
    Icon: FiAlertOctagon,
    tone: 'bg-red-50 text-red-800 ring-red-200',
    bar: 'bg-red-500',
    hint: 'What is live is not what the build recorded.',
  },
  missing: {
    label: 'Missing',
    Icon: FiXCircle,
    tone: 'bg-red-50 text-red-800 ring-red-200',
    bar: 'bg-red-500',
    hint: 'The index does not exist.',
  },
  unreachable: {
    label: 'Unreachable',
    Icon: FiHelpCircle,
    tone: 'bg-gray-100 text-gray-700 ring-gray-300',
    bar: 'bg-gray-400',
    hint: 'No answer: the cluster or API is down, or not reachable from here.',
  },
  blocked: {
    label: 'Blocked',
    Icon: FiShield,
    tone: 'bg-amber-50 text-amber-800 ring-amber-200',
    bar: 'bg-amber-400',
    hint: "The site's bot protection (Cloudflare) refused a request from a script. Ask its admins to let this host through, or compare from a browser.",
  },
  not_served: {
    label: 'Not asked',
    Icon: FiInfo,
    tone: 'bg-white text-gray-500 ring-gray-200',
    bar: 'bg-gray-200',
    hint: 'This version is not among the ones the API is asked about.',
  },
}

export const statusStyle = (status: string): StatusStyle => STYLES[status] ?? STYLES.unknown

export const statusLabel = (status: string): string => STYLES[status]?.label ?? `Unknown: ${status}`

export interface StatusBadgeProps {
  status: string
  /** Replaces the word where the context words it differently; the icon stays. */
  label?: string
  /** A figure the state carries, e.g. `3 of 12`. */
  detail?: string
}

export const StatusBadge = ({ status, label, detail }: StatusBadgeProps) => {
  const style = statusStyle(status)
  return (
    <Tooltip label={style.hint} openDelay={300}>
      <span
        data-status={status}
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs whitespace-nowrap ring-1 ${style.tone}`}
      >
        <style.Icon size={12} aria-hidden="true" className="shrink-0" />
        <span>{label ?? statusLabel(status)}</span>
        {detail && <span className="figures opacity-75">{detail}</span>}
      </span>
    </Tooltip>
  )
}

/** A finding's severity, as an icon and a word. */
export const SEVERITY = {
  fail: { label: 'Fail', Icon: FiXCircle, tone: 'text-red-700' },
  warn: { label: 'Warning', Icon: FiAlertTriangle, tone: 'text-amber-700' },
  info: { label: 'Note', Icon: FiInfo, tone: 'text-gray-500' },
} as const
