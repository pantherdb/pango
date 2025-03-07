import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import { ENVIRONMENT } from '@/@pango.core/data/constants'
import AnnotationTable from '@/features/annotations/components/AnnotationTable'
import { useGetAnnotationsQuery } from '@/features/annotations/slices/annotationsApiSlice'
import GeneSummary from '@/features/genes/components/GeneSummary'
import { transformTerms } from '@/features/genes/services/genesService'
import { useEffect } from 'react'
import { FiExternalLink } from 'react-icons/fi'
import { useParams } from 'react-router-dom'
import { useAppDispatch } from './hooks'
import { TermType } from '@/features/terms/models/term'
import { ASPECT_ORDER } from '@/@pango.core/data/config'
import {
  getAGRLink,
  getFamilyLink,
  getHGNC,
  getHGNCLink,
  getNCBIGeneLink,
  getUCSCBrowserLink,
  getUniprotLink,
} from '@/@pango.core/services/linksService'
import theme from '@/@pango.core/theme/theme'
import { useMediaQuery } from '@mui/system'
import AnnotationCards from '@/features/annotations/components/AnnotationCards'
import { handleExternalLinkClick } from '@/analytics'

interface InfoRowProps {
  label: string
  value: string
  href?: string
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, href }) => {
  return (
    <div className="flex flex-wrap items-center p-1">
      <span className="pr-2 font-semibold text-gray-600">{label}:</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleExternalLinkClick(href)}
          className="flex items-center break-all"
        >
          {value} <FiExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
        </a>
      ) : (
        <span className="break-all">{value}</span>
      )}
    </div>
  )
}

interface StatBlockProps {
  number: number
  label: string
  sublabel?: string
}

const StatBlock: React.FC<StatBlockProps> = ({ number, label, sublabel }) => (
  <div className="flex w-full items-center pl-2 md:w-auto md:pl-6">
    <span className="mr-4 text-3xl font-bold text-sky-700 md:text-5xl">{number}</span>
    <div className="label-group">
      <div className="mb-1 text-sm font-medium md:text-base">{label}</div>
      {sublabel && <div className="text-sm font-normal text-gray-600">{sublabel}</div>}
    </div>
  </div>
)

const Gene: React.FC = () => {
  const dispatch = useAppDispatch()
  const { id: geneId } = useParams<{ id: string }>()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    dispatch(setLeftDrawerOpen(false))
  }, [dispatch])

  const filterArgs = { geneIds: [geneId] }
  const pageArgs = { page: 0, size: 200 }
  const { data: annotationsData } = useGetAnnotationsQuery({
    filterArgs,
    pageArgs,
  })

  const annotations = [...(annotationsData?.annotations || [])].sort((a, b) => {
    const aspectA = a.term?.aspect?.toLowerCase() || ''
    const aspectB = b.term?.aspect?.toLowerCase() || ''
    return (ASPECT_ORDER[aspectA] || 999) - (ASPECT_ORDER[aspectB] || 999)
  })

  const annotation = annotations && annotations.length > 0 ? annotations[0] : null
  const hgncId = getHGNC(annotation?.longId || '')

  if (!annotation) {
    return <div className="p-4">Loading...</div>
  }

  const knownTermTypes = annotations.filter(a => a.termType === TermType.KNOWN).length
  const unknownTermTypes = annotations.filter(a => a.termType === TermType.UNKNOWN).length
  const groupedTerms = transformTerms(annotations, 150)

  return (
    <div className="w-full bg-slate-100">
      <div className="mx-auto max-w-6xl p-3">
        {/* Gene Header Section */}
        <div className="pango-gene-summary w-full px-3 py-4 pb-6 md:pb-10">
          <h1 className="mb-6 text-xl font-normal md:mb-10 md:text-4xl">
            <span className="font-bold">{annotation.geneSymbol}</span>: PAN-GO functions and
            evidence
          </h1>

          <div className="flex w-full flex-col md:flex-row">
            {/* Gene Information Column */}
            <div className="mb-6 w-full md:mb-0 md:w-1/2 md:gap-4">
              <h2 className="mb-4 text-lg font-semibold md:text-2xl">Gene Information</h2>
              <div className="text-sm md:text-base">
                <InfoRow label="Gene" value={annotation.geneSymbol} />
                <InfoRow label="Protein" value={annotation.geneName} />
                <InfoRow
                  label="GO annotations from all sources"
                  value={annotation?.gene}
                  href={ENVIRONMENT.amigoGPUrl + annotation.gene}
                />
                <InfoRow
                  label="PAN-GO evolutionary model for this family"
                  value={annotation.pantherFamily}
                  href={ENVIRONMENT.pantreeUrl + annotation.pantherFamily}
                />
              </div>
            </div>

            {/* External Links Column */}
            <div className="w-full md:mb-0 md:w-1/2">
              <h2 className="mb-4 text-lg font-semibold md:text-2xl">External Links</h2>
              <div className="text-sm md:text-base">
                <InfoRow
                  label="UniProt"
                  value={annotation?.gene}
                  href={getUniprotLink(annotation.gene)}
                />
                <InfoRow
                  label="PANTHER Tree Viewer"
                  value={annotation.pantherFamily}
                  href={getFamilyLink(annotation)}
                />
                {annotation.coordinatesChrNum && (
                  <InfoRow
                    label="UCSC Genome Browser"
                    value={`chr${annotation.coordinatesChrNum}:${annotation.coordinatesStart}-${annotation.coordinatesEnd}`}
                    href={getUCSCBrowserLink(annotation)}
                  />
                )}

                {hgncId && (
                  <>
                    <InfoRow
                      label="Alliance of Genome Resources"
                      value={hgncId}
                      href={getAGRLink(hgncId)}
                    />
                    <InfoRow
                      label="HUGO Gene Nomenclature Committee"
                      value={hgncId}
                      href={getHGNCLink(hgncId)}
                    />
                  </>
                )}
                <InfoRow
                  label="NCBI Gene"
                  value={annotation.geneSymbol}
                  href={getNCBIGeneLink(annotation.geneSymbol)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Header */}
        <div className="bg-gradient-to-r from-slate-100 to-white px-2 py-6">
          <div className="flex items-center gap-1 md:gap-12">
            <div className="min-w-[110px] md:w-[250px]">
              <h2 className="text m-0 font-semibold tracking-tight md:text-2xl">
                Function Summary
              </h2>
            </div>
            <StatBlock
              number={knownTermTypes}
              label="Annotations"
              sublabel="(functional characteristics)"
            />
            <StatBlock number={unknownTermTypes} label="Unknown function aspects" />
          </div>
        </div>
        {annotations.length > 0 && (
          <div className="w-full bg-white">
            <GeneSummary groupedTerms={groupedTerms} />
          </div>
        )}
        <div className="bg-gradient-to-r from-slate-100 to-white px-4 py-6">
          <h2 className="m-0 text-lg font-semibold tracking-tight md:text-2xl">Function Details</h2>
        </div>
        {annotations.length > 0 && (
          <div className="w-full bg-white">
            {isMobile ? (
              <AnnotationCards annotations={annotations} />
            ) : (
              <AnnotationTable annotations={annotations} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Gene
