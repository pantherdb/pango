import type React from 'react'
import type { Gene } from '../models/gene'
import { VersionedLink } from '@/shared/components/VersionedLink'
import { trackEvent } from '@/analytics'
interface GeneResultsProps {
  genes: Gene[]
}

const GeneResults: React.FC<GeneResultsProps> = ({ genes }) => {
  const onHandleGeneClick = (gene: Gene) => {
    trackEvent('Search', 'Gene Selection', gene.gene)
  }

  return (
    <div className="overflow-x-auto">
      {genes.map((gene: Gene) => (
        <VersionedLink
          key={gene.gene}
          onClick={() => onHandleGeneClick(gene)}
          to={`/gene/${gene.gene}`}
          className="no-underline"
          target="_blank"
          rel="noreferrer"
        >
          <div className="border-b border-primary-300 p-4 hover:bg-primary-100 hover:font-bold">
            <div className="text-lg font-bold">{gene.geneSymbol}</div>
            <div className="text-gray-600">{gene.geneName}</div>
          </div>
        </VersionedLink>
      ))}
    </div>
  )
}

export default GeneResults
