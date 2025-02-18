import type React from 'react'
import { FaFlask } from 'react-icons/fa'
import { Tooltip } from '@mui/material'
import { ASPECT_MAP, EVIDENCE_TYPE_MAP, EvidenceType } from '@/@pango.core/data/config'
import type { Term } from '../models/term'
import TermLink from './TermLink'
import { GiTreeBranch } from "react-icons/gi";
import { FiEye, FiX } from "react-icons/fi";

interface TermsProps {
  terms: Term[]
  maxTerms: number
  onToggleExpand: () => void
}

export const Terms: React.FC<TermsProps> = ({ terms, maxTerms, onToggleExpand }) => {
  return (
    <>
      {terms.slice(0, maxTerms).map((term, idx) => (
        <div key={idx} className="w-full">
          <div
            className={`m-2 flex items-center rounded-xl border border-gray-400 p-1`}
            style={{
              backgroundColor: ASPECT_MAP[term.aspect]?.color + '20',
            }}
          >
            <div className="w-11">
              <Tooltip title={EVIDENCE_TYPE_MAP[term.evidenceType]?.iconTooltip}>
                <div className="flex justify-center items-center h-10 w-10 text-gray-600">
                  {term.evidenceType === EvidenceType.DIRECT && (
                    <FaFlask
                      className={`text-3xl`}
                    />
                  )}

                  {term.evidenceType === EvidenceType.HOMOLOGY && (
                    <div className={`text-3xl`}>
                      <GiTreeBranch />
                    </div>
                  )}

                  {term.evidenceType === EvidenceType.NA && (
                    <div className="relative text-3xl">
                      <FiEye className='text-gray-400' />
                      <FiX className="absolute top-2 left-1 text-red-300" />
                    </div>
                  )}
                </div>
              </Tooltip>
            </div>
            <div className="flex-1">
              <TermLink term={term} />
            </div>
          </div>
        </div>
      ))}
      {terms.length > maxTerms && (
        <button onClick={onToggleExpand} className="mt-2 text-blue-600 hover:text-blue-800">
          — View {terms.length - maxTerms} more terms
        </button>
      )}
    </>
  )
}

export default Terms
