import { Select } from '@mantine/core'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs, PageHeader } from '@/features/builds/components/PageParts'
import { SectionPanel } from '@/features/builds/components/SectionPanel'
import { compareFigures } from '@/features/builds/model/compare'
import type { FigureDelta } from '@/features/builds/model/compare'
import { byBuildDateDesc, previousBuild } from '@/features/builds/model/summary'
import {
  useGetBuildQuery,
  useGetBuildsQuery,
  useGetRunQuery,
} from '@/features/builds/services/buildsApi'
import { BarList, Histogram, SplitBar } from '@/shared/components/charts'
import type { Datum } from '@/shared/components/charts'
import { EmptyState, ErrorNotice, Loading } from '@/shared/components/Misc'
import { Panel } from '@/shared/components/Panel'
import { Table } from '@/shared/components/Table'
import { formatCount, formatDate, formatDelta } from '@/shared/format'

const data = (values: Record<string, number> | undefined): Datum[] =>
  Object.entries(values ?? {}).map(([key, value]) => ({ key, value }))

const ChartCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="min-w-0">
    <h3 className="m-0 mb-2 text-xs font-semibold text-gray-700">{title}</h3>
    {children}
  </div>
)

/**
 * One dataset of one build, for the reader who wants to know what is in it rather than how the
 * build ran: its figures against another build of it, its make-up as charts, and every report
 * table the build recorded.
 */
const DatasetPage = () => {
  const { buildId = '', dataset = '' } = useParams()
  const build = useGetBuildQuery(buildId)
  const builds = useGetBuildsQuery()
  const summary = build.data?.summary
  const current = summary?.datasets.find(d => d.id === dataset) ?? null
  const reportId = current?.steps.find(cell => cell.step === 'report')?.runId ?? null
  const verifyId = current?.steps.find(cell => cell.step === 'verify')?.runId ?? null
  const report = useGetRunQuery({ buildId, runId: reportId ?? '' }, { skip: !reportId })
  const verify = useGetRunQuery({ buildId, runId: verifyId ?? '' }, { skip: !verifyId })
  const [chosen, setChosen] = useState<string | null>(null)

  const candidates = useMemo(
    () =>
      [...(builds.data?.builds ?? [])]
        .filter(
          other =>
            other.buildId !== buildId &&
            other.datasets.some(d => d.id === dataset && 'annotations' in d.counters)
        )
        .sort(byBuildDateDesc),
    [builds.data, buildId, dataset]
  )

  if (build.isLoading) return <Loading what="the build" />
  if (build.error || !summary)
    return <ErrorNotice title={`Could not load build ${buildId}`} error={build.error} />
  if (!current)
    return <ErrorNotice title={`Build ${summary.label ?? buildId} has no dataset ${dataset}`} />

  const fallback = previousBuild(builds.data?.builds ?? [], summary, dataset)
  const compared = candidates.find(other => other.buildId === (chosen ?? fallback?.buildId)) ?? null
  const comparedCounters = compared?.datasets.find(d => d.id === dataset)?.counters ?? null
  const rows = compareFigures(current.counters, comparedCounters)
  const breakdowns = report.data?.record.breakdowns
  const buildName = summary.label ?? summary.buildId

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Builds', to: '/' },
          { label: buildName, to: `/builds/${encodeURIComponent(buildId)}` },
          { label: dataset },
        ]}
      />
      <PageHeader title={dataset}>
        <p className="m-0 text-sm text-gray-600">
          As built by <Link to={`/builds/${encodeURIComponent(buildId)}`}>{buildName}</Link> (
          {formatDate(summary.asOf)})
          {typeof current.release?.version === 'string' ? (
            <> from release {current.release.version}</>
          ) : null}
        </p>
      </PageHeader>

      {!reportId ? (
        <EmptyState title={`This build has no data report for ${dataset}`}>
          Builds made by <code>all.sh</code> run <code>src.data_report</code> after the gene
          annotations; a re-index doesn't. Its Elasticsearch check is below if it ran one.
        </EmptyState>
      ) : (
        <>
          <Panel
            title="What it holds"
            subtitle={compared ? undefined : 'no other build of this dataset to compare with'}
            actions={
              candidates.length > 0 && (
                <Select
                  size="xs"
                  aria-label="Compare with"
                  w={260}
                  value={compared?.buildId ?? null}
                  onChange={value => setChosen(value)}
                  data={candidates.map(other => ({
                    value: other.buildId,
                    label: `${other.label ?? other.buildId} (${formatDate(other.asOf)})`,
                  }))}
                />
              )
            }
            flush
          >
            <Table<FigureDelta>
              label="Figures"
              rows={rows}
              rowKey={row => row.key}
              columns={[
                { key: 'label', header: 'Figure', cell: row => row.label },
                {
                  key: 'current',
                  header: 'This build',
                  align: 'right',
                  cell: row => formatCount(row.current),
                },
                ...(compared
                  ? [
                      {
                        key: 'previous',
                        header: compared.label ?? compared.buildId,
                        align: 'right' as const,
                        cell: (row: FigureDelta) => formatCount(row.previous),
                      },
                      {
                        key: 'change',
                        header: 'Change',
                        align: 'right' as const,
                        cell: (row: FigureDelta) => (
                          <span
                            className={
                              row.large
                                ? 'font-medium text-amber-800'
                                : row.change === 'same'
                                  ? 'text-gray-400'
                                  : 'text-gray-700'
                            }
                          >
                            {row.change === 'new'
                              ? 'new'
                              : row.change === 'gone'
                                ? 'gone'
                                : formatDelta(row.delta, row.pct)}
                          </span>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Panel>

          {report.error ? (
            <ErrorNotice title="Could not load the data report" error={report.error} />
          ) : breakdowns ? (
            <Panel title="Make-up">
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Annotations by aspect">
                  <SplitBar
                    label="Annotations by aspect"
                    data={data(breakdowns.annotations_by_aspect)}
                  />
                </ChartCard>
                <ChartCard title="Annotations by evidence type">
                  <BarList
                    label="Annotations by evidence type"
                    data={data(breakdowns.annotations_by_evidence_type)}
                  />
                </ChartCard>
                <ChartCard title="Terms per gene">
                  <Histogram
                    label="Terms per gene"
                    data={data(breakdowns.genes_by_terms)}
                    unit="genes"
                  />
                </ChartCard>
                <ChartCard title="Evidence lines per annotation">
                  <Histogram
                    label="Evidence lines per annotation"
                    data={data(breakdowns.annotations_by_evidence)}
                    unit="annotations"
                  />
                </ChartCard>
                <ChartCard title="Annotations by contributing group">
                  <BarList
                    label="Annotations by contributing group"
                    data={data(breakdowns.annotations_by_group)}
                    limit={12}
                    tone="bg-accent-500"
                  />
                </ChartCard>
                <ChartCard title="With-genes by taxon">
                  <BarList
                    label="With-genes by taxon"
                    data={data(breakdowns.with_genes_by_taxon)}
                    limit={12}
                    tone="bg-teal-500"
                  />
                </ChartCard>
              </div>
            </Panel>
          ) : (
            <Loading what="the data report" />
          )}

          {report.data?.record.sections.map(section => (
            <SectionPanel key={section.id} section={section} />
          ))}
        </>
      )}

      {verify.data?.record.sections.map(section => (
        <SectionPanel key={section.id} section={section} />
      ))}
      {!verifyId && reportId && (
        <p className="m-0 text-xs text-gray-500">
          No Elasticsearch check ran for {dataset} in this build.
        </p>
      )}
    </div>
  )
}

export default DatasetPage
