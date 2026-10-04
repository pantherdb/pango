/**
 * Reads the loader's builds dir, as loader/docs/build-record.md lays it out:
 * `<builds dir>/<build>/build.json` and `<build>/runs/<run>/run.json` + `events.jsonl`.
 *
 * Read-only: nothing here writes to the builds dir. Each record is parsed once per change (cached
 * by mtime and size), so polling costs a stat per file. Health is judged again on every request,
 * because "stale" depends on the clock.
 */

import fs from 'node:fs'
import path from 'node:path'
import { parseBuild, parseEvent, parseRun } from '../src/features/builds/model/parse'
import {
  byBuildDateDesc,
  healthOfSummary,
  runFacts,
  summarizeBuild,
} from '../src/features/builds/model/summary'
import type { RunFacts } from '../src/features/builds/model/summary'
import type {
  BuildRecord,
  BuildResponse,
  BuildsResponse,
  BuildSummary,
  EventsResponse,
  RunEvent,
  RunResponse,
  RunSummary,
} from '../src/features/builds/model/types'

/** The ids the loader writes: [A-Za-z0-9._-], never a path. */
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/

export const isSafeId = (id: string): boolean => SAFE_ID.test(id) && !id.includes('..')

export type StoreResult<T> = { ok: true; body: T } | { ok: false; status: number; message: string }

interface Cached<T> {
  mtimeMs: number
  size: number
  value: T | null
  error: string | null
}

export interface BuildsStore {
  readonly buildsDir: string
  builds(): BuildsResponse
  build(id: string): StoreResult<BuildResponse>
  run(buildId: string, runId: string): StoreResult<RunResponse>
  events(buildId: string, runId: string, after: number, limit: number): StoreResult<EventsResponse>
  /** The parsed build.json, for the live checks. */
  buildRecord(id: string): BuildRecord | null
}

export interface BuildsStoreOptions {
  buildsDir: string
  /** The clock "stale" is judged by; tests pin it. */
  now?: () => Date
}

const notFound = (message: string) => ({ ok: false as const, status: 404, message })

export function createBuildsStore({
  buildsDir,
  now = () => new Date(),
}: BuildsStoreOptions): BuildsStore {
  const builds = new Map<string, Cached<BuildRecord>>()
  // Run summaries are cached without their health, which is judged per request.
  const runs = new Map<string, Cached<RunFacts>>()

  const directories = (parent: string): string[] => {
    try {
      return fs
        .readdirSync(parent, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && isSafeId(entry.name))
        .map(entry => entry.name)
        .sort()
    } catch {
      return []
    }
  }

  /** null when the file doesn't exist (yet: a run makes its folder first). */
  function load<T>(
    cache: Map<string, Cached<T>>,
    file: string,
    read: (raw: unknown) => T
  ): Cached<T> | null {
    let stat: fs.Stats
    try {
      stat = fs.statSync(file)
    } catch {
      return null
    }
    const hit = cache.get(file)
    if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) return hit
    let entry: Cached<T>
    try {
      entry = {
        mtimeMs: stat.mtimeMs,
        size: stat.size,
        value: read(JSON.parse(fs.readFileSync(file, 'utf-8'))),
        error: null,
      }
    } catch (error) {
      entry = {
        mtimeMs: stat.mtimeMs,
        size: stat.size,
        value: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
    cache.set(file, entry)
    return entry
  }

  const loadBuild = (id: string) => load(builds, path.join(buildsDir, id, 'build.json'), parseBuild)

  const runSummaries = (buildId: string, unreadable: string[], at: Date): RunSummary[] => {
    const runsDir = path.join(buildsDir, buildId, 'runs')
    const result: RunSummary[] = []
    for (const runId of directories(runsDir)) {
      const entry = load(runs, path.join(runsDir, runId, 'run.json'), raw =>
        runFacts(parseRun(raw))
      )
      if (!entry) continue
      if (entry.value) result.push({ ...entry.value, health: healthOfSummary(entry.value, at) })
      else unreadable.push(`${buildId}/runs/${runId}/run.json: ${entry.error}`)
    }
    return result
  }

  const summary = (id: string, unreadable: string[], at: Date): BuildSummary | null => {
    const entry = loadBuild(id)
    if (!entry) return null
    if (!entry.value) {
      unreadable.push(`${id}/build.json: ${entry.error}`)
      return null
    }
    return summarizeBuild(entry.value, runSummaries(id, unreadable, at), at)
  }

  const runDir = (buildId: string, runId: string): string | null =>
    isSafeId(buildId) && isSafeId(runId) ? path.join(buildsDir, buildId, 'runs', runId) : null

  return {
    buildsDir,

    builds() {
      const at = now()
      const unreadable: string[] = []
      const list = directories(buildsDir)
        .map(id => summary(id, unreadable, at))
        .filter((build): build is BuildSummary => build !== null)
        .sort(byBuildDateDesc)
      return { buildsDir, serverTime: at.toISOString(), builds: list, unreadable }
    },

    build(id) {
      if (!isSafeId(id)) return notFound(`No build ${id}`)
      const at = now()
      const unreadable: string[] = []
      const entry = loadBuild(id)
      if (!entry) return notFound(`No build ${id}`)
      if (!entry.value)
        return { ok: false, status: 422, message: `build.json does not parse: ${entry.error}` }
      const runList = runSummaries(id, unreadable, at)
      let raw: unknown
      try {
        raw = JSON.parse(fs.readFileSync(path.join(buildsDir, id, 'build.json'), 'utf-8'))
      } catch {
        raw = {}
      }
      return {
        ok: true,
        body: {
          serverTime: at.toISOString(),
          build: raw,
          summary: summarizeBuild(entry.value, runList, at),
          runs: runList.sort((a, b) => (a.startedAt ?? '').localeCompare(b.startedAt ?? '')),
          unreadable,
        },
      }
    },

    run(buildId, runId) {
      const dir = runDir(buildId, runId)
      if (!dir) return notFound(`No run ${buildId}/${runId}`)
      let text: string
      try {
        text = fs.readFileSync(path.join(dir, 'run.json'), 'utf-8')
      } catch {
        return notFound(`No run ${buildId}/${runId}`)
      }
      try {
        return { ok: true, body: { serverTime: now().toISOString(), run: JSON.parse(text) } }
      } catch (error) {
        return {
          ok: false,
          status: 422,
          message: `run.json does not parse: ${error instanceof Error ? error.message : error}`,
        }
      }
    },

    events(buildId, runId, after, limit) {
      const dir = runDir(buildId, runId)
      if (!dir) return notFound(`No run ${buildId}/${runId}`)
      let text: string
      try {
        text = fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf-8')
      } catch {
        return notFound(`No events for ${buildId}/${runId}`)
      }
      const all: RunEvent[] = []
      for (const line of text.split('\n')) {
        if (!line.trim()) continue
        try {
          const event = parseEvent(JSON.parse(line))
          if (event) all.push(event)
        } catch {
          // A line still being written; the next poll reads it whole.
        }
      }
      const events = all.filter(event => event.seq > after).slice(0, limit)
      return {
        ok: true,
        body: {
          serverTime: now().toISOString(),
          events,
          next: events.at(-1)?.seq ?? after,
          total: all.length,
        },
      }
    },

    buildRecord(id) {
      if (!isSafeId(id)) return null
      return loadBuild(id)?.value ?? null
    },
  }
}
