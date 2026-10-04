import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { getConfig } from '@/@pango.core/data/constants'
import FloatingFeedback from '@/shared/components/FloatingFeedback'

const config = getConfig()

const reportLink = () => screen.queryByText('Submit a quick report')?.closest('a')

describe('FloatingFeedback', () => {
  it('opens a panel with a prefilled report link and closes it again', async () => {
    const { user } = renderWithProviders(<FloatingFeedback geneSymbol="TP53" />)
    expect(reportLink()).toBeUndefined()

    await user.click(screen.getByLabelText('Report Annotation issue'))

    expect(reportLink()).toHaveAttribute(
      'href',
      `${config.CONTACT_PREFILL_URL}&entry.1624035027=TP53&entry.15683129=TP53&entry.168426483=TP53&entry.391072423=TP53`
    )
    expect(screen.queryByLabelText('Report Annotation issue')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Close feedback panel'))

    expect(reportLink()).toBeUndefined()
    expect(screen.getByLabelText('Report Annotation issue')).toBeInTheDocument()
  })

  it('links to the blank form when there is no gene', async () => {
    const { user } = renderWithProviders(<FloatingFeedback geneSymbol="" />)

    await user.click(screen.getByLabelText('Report Annotation issue'))

    expect(reportLink()).toHaveAttribute('href', config.CONTACT_URL)
  })
})
