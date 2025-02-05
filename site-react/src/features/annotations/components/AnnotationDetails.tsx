import type React from 'react'
import { BsBookmark, BsInfoCircle } from 'react-icons/bs'
import { MdCategory, MdGroups } from 'react-icons/md'
import type { Annotation } from '../models/annotation'
import { ASPECT_MAP } from '@/@pango.core/data/config'
import { FaDna } from 'react-icons/fa'

interface Props {
  annotation: Annotation
}

export const AnnotationDetails: React.FC<Props> = ({ annotation }) => {
  if (!annotation) return null

  const getAspectChip = (aspect: string) => {
    const aspectInfo = ASPECT_MAP[aspect]
    if (!aspectInfo) return null

    return (
      <span
        className="ml-2 rounded-full border px-2 py-1 text-xs font-semibold"
        style={{
          borderColor: aspectInfo.color,
          color: aspectInfo.color,
        }}
      >
        {aspectInfo.shorthand}
      </span>
    )
  }

  const Section = ({
    title,
    icon,
    children,
  }: {
    title: string
    icon: React.ReactNode
    children: React.ReactNode
  }) => (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>
      {children}
      <div className="mt-4 border-b border-gray-200" />
    </div>
  )

  return (
    <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
      <div className="rounded-t-lg bg-gray-50 p-4">
        <h1 className="text-xl font-bold text-gray-800">Annotation Details</h1>
      </div>
      <div className="p-6">
        <Section title="Gene" icon={<FaDna className="h-5 w-5 text-blue-500" />}>
          <div className="space-y-2">
            <a
              href={`/gene/${annotation.gene}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              {annotation.gene}
            </a>
            <div className="text-gray-600">{annotation.geneSymbol}</div>
            <div className="">{annotation.geneName}</div>
          </div>
        </Section>

        <Section title="Term" icon={<BsBookmark className="h-5 w-5 text-green-500" />}>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold">{annotation.term.id}</span>
            {getAspectChip(annotation.term.aspect)}
          </div>
          <div className="text-gray-700">{annotation.term.label}</div>
        </Section>

        <Section
          title="GO Function Categories"
          icon={<MdCategory className="h-5 w-5 text-purple-500" />}
        >
          <div className="space-y-3">
            {annotation.slimTerms.map((term, index) => (
              <div key={index} className="rounded-lg bg-gray-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold">{term.id}</span>
                  {getAspectChip(term.aspect)}
                </div>
                <div className="text-gray-700">{term.label}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Group" icon={<MdGroups className="h-5 w-5 text-amber-500" />}>
          <div className="space-y-2">
            {annotation.detailedGroups.map(
              (group, index) =>
                group && (
                  <a
                    key={index}
                    href={group.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 transition-colors hover:text-blue-800"
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
            {annotation.evidence.map((item, index) => (
              <div key={index} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 font-semibold">
                  {item.withGeneId?.gene} ({item.withGeneId?.geneSymbol})
                  <div className="font-normal text-gray-600">{item.withGeneId?.geneName}</div>
                </div>
                {item.references?.map((reference, refIndex) => (
                  <div
                    key={refIndex}
                    className="ml-4 mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="font-semibold text-blue-600">{reference.pmid}</div>
                    <div className="my-1">{reference.title}</div>
                    <div className="text-xs text-gray-500">{reference.date}</div>
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
