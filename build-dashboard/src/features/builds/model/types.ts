/**
 * The loader's build records as the dashboard reads them: loader/docs/build-record.md, schema 1,
 * parsed into camelCase by parse.ts. Status fields stay plain strings, so a literal from a newer
 * loader is shown as itself rather than coerced.
 */

/** What the dashboard says about a build or run, worst first after `running` (health.ts). */
export type Health = 'running' | 'stale' | 'failed' | 'interrupted' | 'unknown' | 'issues' | 'ok'

/** A pipeline-grid cell: a run's health, or the state of a step that has no run. */
export type StepState = Health | 'pending' | 'not_reached'

export interface SchemaCheck {
  version: number | null
  /** Set when the record's version isn't the one this dashboard knows. */
  message: string | null
}

export interface Fingerprint {
  role: string | null
  path: string
  bytes: number | null
  modifiedAt: string | null
  sha256: string | null
  records: number | null
}

export interface Artifact extends Fingerprint {
  at: string | null
  phase: string | null
}

export interface GitInfo {
  commit: string | null
  short: string | null
  branch: string | null
  dirty: boolean | null
}

export interface DatasetIndexes {
  annotations: string | null
  genes: string | null
}

export interface DatasetPlan {
  id: string | null
  inputDir: string | null
  outputDir: string | null
  release: Record<string, unknown> | null
  inputs: Fingerprint[]
  steps: string[]
  indexes: DatasetIndexes | null
}

export interface BuildRecord {
  schema: SchemaCheck
  buildId: string
  label: string | null
  script: string
  status: string
  statusReason: string | null
  exitCode: number | null
  startedAt: string | null
  updatedAt: string | null
  finishedAt: string | null
  durationS: number | null
  asOf: string | null
  host: { name: string | null; platform: string | null; python: string | null }
  process: { pid: number | null; argv: string[]; cwd: string | null }
  git: GitInfo | null
  packages: Record<string, string | null>
  config: Record<string, unknown>
  esUrl: string | null
  sharedInputs: Fingerprint[]
  datasets: DatasetPlan[]
  /** Fields that were missing or of the wrong type, as `field: problem`. */
  issues: string[]
}

export interface Phase {
  id: string
  name: string
  status: string
  startedAt: string | null
  finishedAt: string | null
  durationS: number | null
  counters: Record<string, number>
  error: string | null
  note: string | null
}

export interface Progress {
  label: string | null
  done: number
  total: number | null
  unit: string | null
  updatedAt: string | null
}

export interface LogSample {
  at: string | null
  message: string
  phase: string | null
  exception: string | null
}

export interface LedgerEntry {
  key: string
  level: string
  logger: string
  template: string
  message: string
  count: number
  firstAt: string | null
  lastAt: string | null
  samples: LogSample[]
}

export interface Ledger {
  total: number
  keys: number
  overflow: number
  entries: LedgerEntry[]
}

export interface Latency {
  count: number
  mean: number | null
  p50: number | null
  p90: number | null
  max: number | null
}

export interface HttpSummary {
  calls: number
  ok: number
  failed: number
  items: number
  unknown: number
  statuses: Record<string, number>
  services: Record<string, number>
  errors: Record<
    string,
    { count: number; statuses: Record<string, number>; message: string | null }
  >
  latencyMs: Latency | null
  firstAt: string | null
  lastAt: string | null
}

export interface EsOp {
  at: string | null
  op: string
  index: string | null
  status: string
  count: number | null
  errors: number | null
  durationS: number | null
  detail: string | null
  phase: string | null
}

export interface EsServer {
  name: string | null
  cluster: string | null
  version: string | null
}

export interface SectionColumn {
  key: string
  label: string
  kind: 'number' | 'text'
}

export interface SectionTable {
  id: string
  title: string
  columns: SectionColumn[]
  rows: Record<string, unknown>[]
  totalRows: number
}

export interface Section {
  id: string
  title: string
  status: string
  message: string | null
  /** The headline figures, in the order the record lists them. */
  headline: [string, number | string | null][]
  tables: SectionTable[]
  text: string | null
}

export interface RunRecord {
  schema: SchemaCheck
  runId: string
  buildId: string
  step: string
  dataset: string | null
  title: string
  status: string
  statusReason: string | null
  exitCode: number | null
  startedAt: string | null
  updatedAt: string | null
  finishedAt: string | null
  durationS: number | null
  heartbeatS: number
  process: { pid: number | null; argv: string[]; cwd: string | null }
  host: { name: string | null; platform: string | null; python: string | null }
  config: Record<string, unknown>
  progress: Progress | null
  phases: Phase[]
  counters: Record<string, number>
  breakdowns: Record<string, Record<string, number>>
  logs: { warning: Ledger; error: Ledger }
  http: HttpSummary | null
  es: { server: EsServer | null; ops: EsOp[] } | null
  artifacts: Artifact[]
  sections: Section[]
  dropped: Record<string, number>
  exception: { type: string; message: string; traceback: string } | null
  eventCount: number
  issues: string[]
}

export interface RunEvent {
  seq: number
  at: string | null
  type: string
  payload: Record<string, unknown>
}

// -- what the server sends --------------------------------------------------------

/** One run, small enough to send a whole build's worth in a list. */
export interface RunSummary {
  runId: string
  buildId: string
  step: string
  dataset: string | null
  title: string
  status: string
  statusReason: string | null
  exitCode: number | null
  startedAt: string | null
  updatedAt: string | null
  finishedAt: string | null
  durationS: number | null
  heartbeatS: number
  health: Health
  phases: { total: number; failed: number; current: string | null }
  progress: Progress | null
  warnings: number
  errors: number
  httpFailed: number
  counters: Record<string, number>
}

/** A pipeline-grid cell: one planned step of one dataset. */
export interface StepCell {
  step: string
  state: StepState
  runId: string | null
  startedAt: string | null
  finishedAt: string | null
  durationS: number | null
  /** Runs of this step beyond the latest, when a step was run again within the build. */
  earlierRuns: number
}

export interface DatasetSummary {
  id: string | null
  steps: StepCell[]
  /** The counters of the dataset's report and verify runs, merged; what builds are compared by. */
  counters: Record<string, number>
  indexes: DatasetIndexes | null
  release: Record<string, unknown> | null
}

export interface FindingCounts {
  fail: number
  warn: number
  info: number
}

export interface BuildSummary {
  buildId: string
  label: string | null
  script: string
  status: string
  statusReason: string | null
  exitCode: number | null
  startedAt: string | null
  updatedAt: string | null
  finishedAt: string | null
  durationS: number | null
  asOf: string | null
  health: Health
  /** A run is running: the build is going on now. */
  live: boolean
  git: GitInfo | null
  esUrl: string | null
  datasets: DatasetSummary[]
  runs: number
  warnings: number
  errors: number
  findings: FindingCounts
  issues: string[]
}

export interface BuildsResponse {
  buildsDir: string
  serverTime: string
  builds: BuildSummary[]
  unreadable: string[]
}

export interface BuildResponse {
  serverTime: string
  build: unknown
  summary: BuildSummary
  runs: RunSummary[]
  unreadable: string[]
}

export interface RunResponse {
  serverTime: string
  run: unknown
}

export interface EventsResponse {
  serverTime: string
  events: RunEvent[]
  next: number
  total: number
}

// -- live checks ----------------------------------------------------------------

export interface LiveTarget {
  name: string
  kind: 'es' | 'api'
  url: string
}

export interface EsIndexLive {
  name: string
  exists: boolean
  docs: number | null
  health: string | null
  createdAt: string | null
  error: string | null
}

export interface EsProbe {
  target: string
  url: string
  reachable: boolean
  error: string | null
  version: string | null
  cluster: string | null
  indexes: EsIndexLive[]
}

export interface ApiVersionLive {
  version: string
  annotations: number | null
  genes: number | null
  error: string | null
  /** The site's bot protection refused the request (production is behind Cloudflare's). */
  blocked: boolean
}

export interface ApiProbe {
  target: string
  url: string
  reachable: boolean
  /** Every request met the site's bot protection. */
  blocked: boolean
  error: string | null
  versions: ApiVersionLive[]
}

export interface LiveBuildResponse {
  serverTime: string
  es: EsProbe | null
  api: ApiProbe[]
}

export interface LiveEnvironmentsResponse {
  serverTime: string
  es: EsProbe[]
  api: ApiProbe[]
}

export interface LiveTargetsResponse {
  targets: LiveTarget[]
  versions: string[]
}
