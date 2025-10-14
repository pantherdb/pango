import { useState } from 'react'
import { FiExternalLink, FiX, FiAlertCircle } from 'react-icons/fi'
import { FcFeedback } from 'react-icons/fc'
import { useConfig } from '@/@pango.core/data/useConfig'
import { handleExternalLinkClick } from '@/analytics'

interface FloatingFeedbackProps {
  geneSymbol: string
}

const FloatingFeedback: React.FC<FloatingFeedbackProps> = ({ geneSymbol }) => {
  const config = useConfig()
  const [open, setOpen] = useState(false)

  const url = geneSymbol
    ? `${config.CONTACT_PREFILL_URL}&entry.1624035027=${geneSymbol}&entry.15683129=${geneSymbol}&entry.168426483=${geneSymbol}&entry.391072423=${geneSymbol}`
    : config.CONTACT_URL

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-20 z-50 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500 shadow-lg hover:bg-amber-800 focus:outline-none"
          aria-label="Report Annotation issue"
        >
          <FcFeedback className="h-12 w-12 text-white" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-10 right-10 z-50 w-96 rounded-lg border border-amber-400 bg-amber-50 p-4 shadow-lg">

          <button
            onClick={() => setOpen(false)}
            aria-label="Close feedback panel"
            className="absolute top-2 right-2"
          >
            <FiX className="h-8 w-8" />
          </button>
          <div className="mb-3 flex items-center gap-2">
            <FiAlertCircle className="h-6 w-6 flex-shrink-0 " />
            <p className="text-sm text-gray-800">Missing or incorrect annotations?</p>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleExternalLinkClick(url)}
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 underline"
          >
            Submit a quick report
            <FiExternalLink className="h-4 w-4 flex-shrink-0" />
          </a>
        </div>
      )}
    </>
  )
}

export default FloatingFeedback
