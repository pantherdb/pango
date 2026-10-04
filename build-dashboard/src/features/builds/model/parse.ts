/**
 * Turns build.json and run.json, as written, into the typed records the views use.
 *
 * Total: never throws. A missing or wrong-typed field becomes null, empty or 0 and is listed in
 * the record's `issues`; an unknown status literal is kept as written. A record from a newer
 * loader is read as far as it is understood and says so in `schema`.
 *
 * Relative imports only: the dev-server plugin bundles this folder before any `@/` alias exists.
 */

import type {
  Artifact,
  BuildRecord,
  DatasetPlan,
  EsOp,
  Fingerprint,
  GitInfo,
  HttpSummary,
  Latency,
  Ledger,
  LedgerEntry,
  Phase,
  Progress,
  RunEvent,
  RunRecord,
  SchemaCheck,
  Section,
  SectionTable,
} from './types'

export const SCHEMA_VERSION = 1

type Raw = Record<string, unknown>

export const isObject = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Reads fields of one object, noting each problem as `where.field: problem`. */
class Fields {
  constructor(
    private readonly raw: Raw,
    private readonly issues: string[],
    private readonly where: string
  ) {}

  private note(key: string, problem: string) {
    this.issues.push(`${this.where}${key}: ${problem}`)
  }

  text(key: string): string | null {
    const value = this.raw[key]
    if (value === undefined || value === null) return null
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    this.note(key, 'expected text')
    return null
  }

  number(key: string): number | null {
    const value = this.raw[key]
    if (value === undefined || value === null) return null
    if (typeof value === 'number' && Number.isFinite(value)) return value
    this.note(key, 'expected a number')
    return null
  }

  bool(key: string): boolean | null {
    const value = this.raw[key]
    if (value === undefined || value === null) return null
    if (typeof value === 'boolean') return value
    this.note(key, 'expected true or false')
    return null
  }

  object(key: string): Raw | null {
    const value = this.raw[key]
    if (value === undefined || value === null) return null
    if (isObject(value)) return value
    this.note(key, 'expected an object')
    return null
  }

  list(key: string): unknown[] {
    const value = this.raw[key]
    if (value === undefined || value === null) return []
    if (Array.isArray(value)) return value
    this.note(key, 'expected a list')
    return []
  }

  strings(key: string): string[] {
    return this.list(key).filter((item): item is string => typeof item === 'string')
  }

  /** A {name: number} map; entries that aren't numbers are dropped and noted. */
  counters(key: string): Record<string, number> {
    const value = this.object(key)
    const result: Record<string, number> = {}
    if (!value) return result
    for (const [name, n] of Object.entries(value)) {
      if (typeof n === 'number' && Number.isFinite(n)) result[name] = n
      else this.note(`${key}.${name}`, 'expected a number')
    }
    return result
  }

  nested(key: string): Fields {
    return new Fields(this.object(key) ?? {}, this.issues, `${this.where}${key}.`)
  }
}

const fieldsOf = (value: unknown, issues: string[], where: string): Fields | null =>
  isObject(value) ? new Fields(value, issues, where) : null

export function schemaCheck(version: number | null): SchemaCheck {
  if (version === null) return { version, message: 'The record has no schema_version.' }
  if (version > SCHEMA_VERSION) {
    return {
      version,
      message: `Written in schema ${version}; this dashboard reads schema ${SCHEMA_VERSION}, so newer fields are not shown.`,
    }
  }
  if (version < SCHEMA_VERSION) {
    return { version, message: `Written in schema ${version}, older than ${SCHEMA_VERSION}.` }
  }
  return { version, message: null }
}

function parseFingerprint(value: unknown, issues: string[], where: string): Fingerprint | null {
  const f = fieldsOf(value, issues, where)
  if (!f) return null
  return {
    role: f.text('role'),
    path: f.text('path') ?? '',
    bytes: f.number('bytes'),
    modifiedAt: f.text('modified_at'),
    sha256: f.text('sha256'),
    records: f.number('records'),
  }
}

const fingerprints = (values: unknown[], issues: string[], where: string): Fingerprint[] =>
  values
    .map((value, i) => parseFingerprint(value, issues, `${where}[${i}].`))
    .filter((print): print is Fingerprint => print !== null)

function parseGit(value: Raw | null, issues: string[]): GitInfo | null {
  if (!value) return null
  const f = new Fields(value, issues, 'git.')
  return {
    commit: f.text('commit'),
    short: f.text('short'),
    branch: f.text('branch'),
    dirty: f.bool('dirty'),
  }
}

function parseDataset(value: unknown, issues: string[], where: string): DatasetPlan | null {
  const f = fieldsOf(value, issues, where)
  if (!f) return null
  const indexes = f.object('indexes')
  const ix = indexes ? new Fields(indexes, issues, `${where}indexes.`) : null
  return {
    id: f.text('id'),
    inputDir: f.text('input_dir'),
    outputDir: f.text('output_dir'),
    release: f.object('release'),
    inputs: fingerprints(f.list('inputs'), issues, `${where}inputs`),
    steps: f.strings('steps'),
    indexes: ix ? { annotations: ix.text('annotations'), genes: ix.text('genes') } : null,
  }
}

const textMap = (value: Raw | null): Record<string, string | null> =>
  Object.fromEntries(
    Object.entries(value ?? {}).map(([k, v]) => [k, typeof v === 'string' ? v : null])
  )

export function parseBuild(raw: unknown): BuildRecord {
  const issues: string[] = []
  const f = new Fields(isObject(raw) ? raw : {}, issues, '')
  if (!isObject(raw)) issues.push('build.json is not an object')
  const host = f.nested('host')
  const proc = f.nested('process')
  const config = f.object('config') ?? {}
  return {
    schema: schemaCheck(f.number('schema_version')),
    buildId: f.text('build_id') ?? '',
    label: f.text('label'),
    script: f.text('script') ?? 'unknown',
    status: f.text('status') ?? 'unknown',
    statusReason: f.text('status_reason'),
    exitCode: f.number('exit_code'),
    startedAt: f.text('started_at'),
    updatedAt: f.text('updated_at'),
    finishedAt: f.text('finished_at'),
    durationS: f.number('duration_s'),
    asOf: f.text('as_of') ?? f.text('started_at'),
    host: { name: host.text('name'), platform: host.text('platform'), python: host.text('python') },
    process: { pid: proc.number('pid'), argv: proc.strings('argv'), cwd: proc.text('cwd') },
    git: parseGit(f.object('git'), issues),
    packages: textMap(f.object('packages')),
    config,
    esUrl: typeof config.es_url === 'string' ? config.es_url : null,
    sharedInputs: fingerprints(f.list('shared_inputs'), issues, 'shared_inputs'),
    datasets: f
      .list('datasets')
      .map((value, i) => parseDataset(value, issues, `datasets[${i}].`))
      .filter((dataset): dataset is DatasetPlan => dataset !== null),
    issues,
  }
}

function parsePhase(value: unknown, issues: string[], where: string): Phase | null {
  const f = fieldsOf(value, issues, where)
  if (!f) return null
  return {
    id: f.text('id') ?? where,
    name: f.text('name') ?? 'phase',
    status: f.text('status') ?? 'unknown',
    startedAt: f.text('started_at'),
    finishedAt: f.text('finished_at'),
    durationS: f.number('duration_s'),
    counters: f.counters('counters'),
    error: f.text('error'),
    note: f.text('note'),
  }
}

function parseProgress(value: Raw | null, issues: string[]): Progress | null {
  if (!value) return null
  const f = new Fields(value, issues, 'progress.')
  return {
    label: f.text('label'),
    done: f.number('done') ?? 0,
    total: f.number('total'),
    unit: f.text('unit'),
    updatedAt: f.text('updated_at'),
  }
}

function parseLedger(value: Raw | null, issues: string[], where: string): Ledger {
  const f = new Fields(value ?? {}, issues, where)
  const entries = f
    .list('entries')
    .map((entry, i): LedgerEntry | null => {
      const e = fieldsOf(entry, issues, `${where}entries[${i}].`)
      if (!e) return null
      return {
        key: e.text('key') ?? String(i),
        level: e.text('level') ?? 'WARNING',
        logger: e.text('logger') ?? '',
        template: e.text('template') ?? '',
        message: e.text('message') ?? '',
        count: e.number('count') ?? 0,
        firstAt: e.text('first_at'),
        lastAt: e.text('last_at'),
        samples: e.list('samples').flatMap((sample, j) => {
          const s = fieldsOf(sample, issues, `${where}entries[${i}].samples[${j}].`)
          return s
            ? [
                {
                  at: s.text('at'),
                  message: s.text('message') ?? '',
                  phase: s.text('phase'),
                  exception: s.text('exception'),
                },
              ]
            : []
        }),
      }
    })
    .filter((entry): entry is LedgerEntry => entry !== null)
  return {
    total: f.number('total') ?? entries.reduce((sum, e) => sum + e.count, 0),
    keys: f.number('keys') ?? entries.length,
    overflow: f.number('overflow') ?? 0,
    entries,
  }
}

function parseLatency(value: Raw | null, issues: string[]): Latency | null {
  if (!value) return null
  const f = new Fields(value, issues, 'http.latency_ms.')
  return {
    count: f.number('count') ?? 0,
    mean: f.number('mean'),
    p50: f.number('p50'),
    p90: f.number('p90'),
    max: f.number('max'),
  }
}

function parseHttp(value: Raw | null, issues: string[]): HttpSummary | null {
  if (!value) return null
  const f = new Fields(value, issues, 'http.')
  const errors: HttpSummary['errors'] = {}
  for (const [type, group] of Object.entries(f.object('errors') ?? {})) {
    const g = fieldsOf(group, issues, `http.errors.${type}.`)
    if (g)
      errors[type] = {
        count: g.number('count') ?? 0,
        statuses: g.counters('statuses'),
        message: g.text('message'),
      }
  }
  return {
    calls: f.number('calls') ?? 0,
    ok: f.number('ok') ?? 0,
    failed: f.number('failed') ?? 0,
    items: f.number('items') ?? 0,
    unknown: f.number('unknown') ?? 0,
    statuses: f.counters('statuses'),
    services: f.counters('services'),
    errors,
    latencyMs: parseLatency(f.object('latency_ms'), issues),
    firstAt: f.text('first_at'),
    lastAt: f.text('last_at'),
  }
}

function parseEs(value: Raw | null, issues: string[]): RunRecord['es'] {
  if (!value) return null
  const f = new Fields(value, issues, 'es.')
  const server = f.object('server')
  const s = server ? new Fields(server, issues, 'es.server.') : null
  const ops = f
    .list('ops')
    .map((op, i): EsOp | null => {
      const o = fieldsOf(op, issues, `es.ops[${i}].`)
      if (!o) return null
      return {
        at: o.text('at'),
        op: o.text('op') ?? 'op',
        index: o.text('index'),
        status: o.text('status') ?? 'unknown',
        count: o.number('count'),
        errors: o.number('errors'),
        durationS: o.number('duration_s'),
        detail: o.text('detail'),
        phase: o.text('phase'),
      }
    })
    .filter((op): op is EsOp => op !== null)
  return {
    server: s
      ? { name: s.text('name'), cluster: s.text('cluster'), version: s.text('version') }
      : null,
    ops,
  }
}

function parseTable(value: unknown, issues: string[], where: string): SectionTable | null {
  const f = fieldsOf(value, issues, where)
  if (!f) return null
  const rows = f.list('rows').filter(isObject)
  return {
    id: f.text('id') ?? where,
    title: f.text('title') ?? '',
    columns: f.list('columns').flatMap((column, i) => {
      const c = fieldsOf(column, issues, `${where}columns[${i}].`)
      const key = c?.text('key')
      if (!c || !key) return []
      return [
        {
          key,
          label: c.text('label') ?? key,
          kind: c.text('kind') === 'number' ? ('number' as const) : ('text' as const),
        },
      ]
    }),
    rows,
    totalRows: f.number('total_rows') ?? rows.length,
  }
}

function parseSection(value: unknown, issues: string[], where: string): Section | null {
  const f = fieldsOf(value, issues, where)
  if (!f) return null
  const headline = Object.entries(f.object('headline') ?? {}).map(
    ([label, figure]): [string, number | string | null] => [
      label,
      typeof figure === 'number' || typeof figure === 'string' ? figure : null,
    ]
  )
  return {
    id: f.text('id') ?? where,
    title: f.text('title') ?? f.text('id') ?? 'Report',
    status: f.text('status') ?? 'ok',
    message: f.text('message'),
    headline,
    tables: f
      .list('tables')
      .map((table, i) => parseTable(table, issues, `${where}tables[${i}].`))
      .filter((table): table is SectionTable => table !== null),
    text: f.text('text'),
  }
}

export function parseRun(raw: unknown): RunRecord {
  const issues: string[] = []
  const f = new Fields(isObject(raw) ? raw : {}, issues, '')
  if (!isObject(raw)) issues.push('run.json is not an object')
  const proc = f.nested('process')
  const host = f.nested('host')
  const logs = f.nested('logs')
  const exception = f.object('exception')
  const ex = exception ? new Fields(exception, issues, 'exception.') : null
  const step = f.text('step') ?? 'unknown'
  const dataset = f.text('dataset')
  const breakdowns: Record<string, Record<string, number>> = {}
  for (const name of Object.keys(f.object('breakdowns') ?? {})) {
    breakdowns[name] = f.nested('breakdowns').counters(name)
  }
  return {
    schema: schemaCheck(f.number('schema_version')),
    runId: f.text('run_id') ?? '',
    buildId: f.text('build_id') ?? '',
    step,
    dataset,
    title: f.text('title') ?? (dataset ? `${step} · ${dataset}` : step),
    status: f.text('status') ?? 'unknown',
    statusReason: f.text('status_reason'),
    exitCode: f.number('exit_code'),
    startedAt: f.text('started_at'),
    updatedAt: f.text('updated_at'),
    finishedAt: f.text('finished_at'),
    durationS: f.number('duration_s'),
    heartbeatS: f.number('heartbeat_s') ?? 10,
    process: { pid: proc.number('pid'), argv: proc.strings('argv'), cwd: proc.text('cwd') },
    host: { name: host.text('name'), platform: host.text('platform'), python: host.text('python') },
    config: f.object('config') ?? {},
    progress: parseProgress(f.object('progress'), issues),
    phases: f
      .list('phases')
      .map((phase, i) => parsePhase(phase, issues, `phases[${i}].`))
      .filter((phase): phase is Phase => phase !== null),
    counters: f.counters('counters'),
    breakdowns,
    logs: {
      warning: parseLedger(logs.object('warning'), issues, 'logs.warning.'),
      error: parseLedger(logs.object('error'), issues, 'logs.error.'),
    },
    http: parseHttp(f.object('http'), issues),
    es: parseEs(f.object('es'), issues),
    artifacts: f.list('artifacts').flatMap((value, i): Artifact[] => {
      const print = parseFingerprint(value, issues, `artifacts[${i}].`)
      if (!print || !isObject(value)) return []
      return [
        {
          ...print,
          at: typeof value.at === 'string' ? value.at : null,
          phase: typeof value.phase === 'string' ? value.phase : null,
        },
      ]
    }),
    sections: f
      .list('sections')
      .map((section, i) => parseSection(section, issues, `sections[${i}].`))
      .filter((section): section is Section => section !== null),
    dropped: f.counters('dropped'),
    exception: ex
      ? {
          type: ex.text('type') ?? 'Exception',
          message: ex.text('message') ?? '',
          traceback: ex.text('traceback') ?? '',
        }
      : null,
    eventCount: f.nested('events').number('count') ?? 0,
    issues,
  }
}

/** One events.jsonl line; null for a line that isn't an event. */
export function parseEvent(raw: unknown): RunEvent | null {
  if (!isObject(raw) || typeof raw.seq !== 'number' || typeof raw.type !== 'string') return null
  const { seq, at, type, ...payload } = raw
  return { seq, at: typeof at === 'string' ? at : null, type, payload }
}
