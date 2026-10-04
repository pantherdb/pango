import { Link } from 'react-router-dom'
import type { Finding } from '@/features/builds/model/checks'
import { Panel } from '@/shared/components/Panel'
import { countOf } from '@/shared/format'
import { SEVERITY } from '@/shared/status'

/** "What to look at": the findings, worst first, each linking to the run that explains it. */
export const FindingsPanel = ({ findings, buildId }: { findings: Finding[]; buildId?: string }) => (
  <Panel
    title="What to look at"
    subtitle={findings.length ? countOf(findings.length, 'finding') : undefined}
  >
    {findings.length === 0 ? (
      <p className="m-0 text-sm text-green-800">
        Nothing: no failures, no problems in the data, nothing left behind.
      </p>
    ) : (
      <ul className="m-0 list-none space-y-2 p-0">
        {findings.map(finding => {
          const severity = SEVERITY[finding.severity]
          return (
            <li key={finding.id} className="flex gap-2 text-sm" data-severity={finding.severity}>
              <severity.Icon
                className={`mt-0.5 shrink-0 ${severity.tone}`}
                aria-label={severity.label}
              />
              <div className="min-w-0">
                <div className="font-medium text-gray-900">
                  {finding.title}
                  {finding.runId && buildId && (
                    <Link
                      to={`/builds/${encodeURIComponent(buildId)}/runs/${encodeURIComponent(finding.runId)}`}
                      className="ml-2 text-xs font-normal"
                    >
                      open the run
                    </Link>
                  )}
                </div>
                {finding.detail && (
                  <div className="text-xs break-words whitespace-pre-line text-gray-600">
                    {finding.detail}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    )}
  </Panel>
)
