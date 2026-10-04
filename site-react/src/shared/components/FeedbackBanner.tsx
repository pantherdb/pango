import type React from 'react'
import { FiAlertCircle, FiExternalLink } from 'react-icons/fi'
import { useConfig } from '@/@pango.core/data/useConfig'
import { handleExternalLinkClick } from '@/analytics'
import { feedbackFormUrl } from '@/shared/utils/feedbackFormUrl'

interface FeedbackBannerProps {
  geneSymbol: string
}

const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ geneSymbol }) => {
  const config = useConfig()
  const url = feedbackFormUrl(config, geneSymbol)

  return (
    <div className="my-6 flex items-start gap-2 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-lg">
      <FiAlertCircle className="mt-[2px] h-5 w-5 flex-shrink-0 text-amber-600" />
      <p className="text-gray-700">
        Missing or incorrect annotations?{' '}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center font-medium text-sky-700 underline"
          onClick={() => handleExternalLinkClick(url)}
        >
          Submit a quick report
          <FiExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
        </a>
        .
      </p>
    </div>
  )
}

export default FeedbackBanner
