import type React from 'react'
import { FaFlask } from 'react-icons/fa'
import { Tooltip } from '@mui/material'
import { EVIDENCE_TYPE_MAP } from '@/@pango.core/data/config'
import type { Term } from '../models/term'
import TermLink from './TermLink'

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
            className={`m-2 flex items-center rounded-xl border border-gray-400 p-2`}
            style={{
              backgroundColor: EVIDENCE_TYPE_MAP[term.evidenceType]?.color + '10',
            }}
          >
            <div className="w-12">
              <Tooltip title={EVIDENCE_TYPE_MAP[term.evidenceType]?.iconTooltip}>
                <div className="relative h-11 w-11">
                  <FaFlask
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl`}
                    style={{
                      color: EVIDENCE_TYPE_MAP[term.evidenceType]?.color + 'A0' || undefined,
                    }}
                  />
                  <span
                    className={`absolute -bottom-1 right-0.5 text-xl font-bold`}
                    style={{
                      color: EVIDENCE_TYPE_MAP[term.evidenceType]?.color || undefined,
                    }}
                  >
                    {EVIDENCE_TYPE_MAP[term.evidenceType]?.shorthand}
                  </span>
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
