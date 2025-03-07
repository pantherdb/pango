import type React from 'react'
import { BsBookmark, BsInfoCircle } from 'react-icons/bs'
import { MdCategory, MdGroups } from 'react-icons/md'
import type { Annotation } from '../models/annotation'
import { ASPECT_MAP } from '@/@pango.core/data/config'
import { FaDna } from 'react-icons/fa'
import TermLink from '@/features/terms/components/TermLink'
import { ENVIRONMENT } from '@/@pango.core/data/constants'
import { getPubmedArticleUrl } from '@/@pango.core/services/linksService'

const Section = ({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="mb-10">
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
    </div>
    {children}
    <div className="mt-4 border-b border-gray-200" />
  </div>
)

interface Props {
  annotation: Annotation
}

export const AnnotationDetails: React.FC<Props> = ({ annotation }) => {
  if (!annotation) return null

  return (
    <div className="w-full rounded-lg bg-white shadow-lg">
      <div className="rounded-t-lg bg-gray-50 p-4">
        <h1 className="text-xl font-bold text-gray-800">Annotation Details</h1>
      </div>
      <div className="p-6">
        <Section title="Gene" icon={<FaDna className="h-5 w-5" />}>
          <div className="space-y-2">
            <a
              href={`/gene/${annotation.gene}`}
              target="_blank"
              rel="noopener noreferrer"
              className=""
            >
              {annotation.gene}
            </a>
            <div className="text-gray-600">{annotation.geneSymbol}</div>
            <div className="">{annotation.geneName}</div>
          </div>
        </Section>

        <Section title="Term" icon={<BsBookmark className="h-5 w-5 text-green-500" />}>
          <div className="flex items-center">
            <span
              className="inline-flex !h-8 !w-8 items-center justify-center rounded-full border text-xs font-bold"
              style={{
                borderColor: ASPECT_MAP[annotation.term.aspect]?.color,
                color: ASPECT_MAP[annotation.term.aspect]?.color,
                backgroundColor: `${ASPECT_MAP[annotation.term.aspect]?.color}20`,
              }}
            >
              {ASPECT_MAP[annotation.term.aspect]?.shorthand}
            </span>
            <div className="ml-2">
              <div className="ml-2">
                <TermLink term={annotation.term} />
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="GO Function Categories"
          icon={<MdCategory className="h-5 w-5 text-purple-500" />}
        >
          <div className="space-y-3">
            {annotation.slimTerms.map((term, termIdx) => (
              <div key={termIdx} className="mb-1 flex items-center last:mb-0">
                <span
                  className="inline-flex !h-8 !w-8 items-center justify-center rounded-full border font-bold"
                  style={{
                    borderColor: ASPECT_MAP[term.aspect]?.color,
                    color: ASPECT_MAP[term.aspect]?.color,
                    backgroundColor: `${ASPECT_MAP[term.aspect]?.color}20`,
                  }}
                >
                  {ASPECT_MAP[term.aspect]?.shorthand}
                </span>
                <div className="ml-2">
                  <TermLink term={term} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Group" icon={<MdGroups className="h-5 w-5 text-amber-500" />}>
          <div className="flex flex-col space-y-2">
            {annotation.detailedGroups.map(
              (group, index) =>
                group && (
                  <a
                    key={index}
                    href={group.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=""
                  >
                    {group.label}
                  </a>
                )
            )}
          </div>
        </Section>
        <Section
          title={`Evidence (${annotation.evidence?.length})`}
          icon={<BsInfoCircle className="h-5 w-5 text-indigo-500" />}
        >
          <div className="space-y-4">
            {annotation.evidence.map((evidence, evidenceIdx) => (
              <div
                key={evidenceIdx}
                className="mb-2 border-b border-gray-200 pb-2 last:mb-0 last:border-0 last:pb-0"
              >
                {evidence.withGeneId && (
                  <div className="mb-2 font-medium">
                    {evidence.withGeneId.gene} ({evidence.withGeneId.geneSymbol}) (
                    <a
                      href={ENVIRONMENT.taxonApiUrl + evidence.withGeneId.taxonId}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=""
                    >
                      {evidence.withGeneId.taxonAbbr}
                    </a>
                    )<div className="font-normal text-gray-600">{evidence.withGeneId.geneName}</div>
                  </div>
                )}
                {evidence.references.map((reference, refIdx) => (
                  <div
                    key={refIdx}
                    className="ml-4 mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <a
                      href={getPubmedArticleUrl(reference.pmid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm"
                    >
                      {reference.pmid}
                    </a>
                    <div className="text-gray-600">
                      {reference.title} <span className="text-gray-500">({reference.date})</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{reference.authors.join(', ')}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

export default AnnotationDetails
