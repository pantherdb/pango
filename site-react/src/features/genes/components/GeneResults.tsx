import type React from 'react'
import type { Gene } from '../models/gene'
import { VersionedLink } from '@/shared/components/VersionedLink'
interface GeneResultsProps {
  genes: Gene[];
}

const GeneResults: React.FC<GeneResultsProps> = ({ genes }) => {
  return (
    <div className="overflow-x-auto">
      {genes.map((gene: Gene) => (
        <VersionedLink
          key={gene.gene}
          to={`/gene/${gene.gene}`}
          className="no-underline"
          target="_blank"
          rel="noreferrer"
        >
          <div className='p-4 border-b border-primary-300  hover:bg-primary-100 hover:font-bold'>
            <div className="text-lg font-bold">
              {gene.geneSymbol}
            </div>
            <div className="text-gray-600">{gene.geneName}</div>
          </div>

        </VersionedLink>
      ))}
    </div>
  )
}

export default GeneResults