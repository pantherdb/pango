import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildTerm } from '@tests/fixtures/builders'
import { EVIDENCE_TYPE_MAP, EvidenceType } from '@/@pango.core/data/config'
import { getConfig } from '@/@pango.core/data/constants'
import Terms from '@/features/terms/components/Terms'

const config = getConfig()

const terms = [
  buildTerm({ evidenceType: EvidenceType.DIRECT }),
  buildTerm({
    id: 'GO:0019899',
    label: 'enzyme binding',
    displayId: 'GO:0019899',
    evidenceType: EvidenceType.HOMOLOGY,
  }),
  buildTerm({
    id: 'UNKNOWN:0001',
    label: 'Unknown molecular function',
    displayId: '',
    evidenceType: EvidenceType.NA,
  }),
]

// A term row holds its evidence icon (the tooltip target) before the term itself.
const evidenceIcon = (label: string) =>
  screen.getByText(label).parentElement?.previousElementSibling?.firstElementChild as HTMLElement

describe('Terms', () => {
  it('lists up to maxTerms terms and offers to show the rest', async () => {
    const onToggleExpand = vi.fn()
    const { user } = renderWithProviders(
      <Terms terms={terms} maxTerms={2} onToggleExpand={onToggleExpand} />
    )

    expect(screen.getByText('protein binding')).toBeInTheDocument()
    expect(screen.getByText('enzyme binding')).toBeInTheDocument()
    expect(screen.queryByText('Unknown molecular function')).not.toBeInTheDocument()

    await user.click(screen.getByText('— View 1 more terms'))

    expect(onToggleExpand).toHaveBeenCalledTimes(1)
  })

  it('has nothing to expand when every term fits', () => {
    renderWithProviders(<Terms terms={terms} maxTerms={3} onToggleExpand={vi.fn()} />)

    expect(screen.getByText('Unknown molecular function')).toBeInTheDocument()
    expect(screen.queryByText(/more terms/)).not.toBeInTheDocument()
  })

  it('links GO terms to AmiGO and shows unknown aspects as plain text', () => {
    renderWithProviders(<Terms terms={terms} maxTerms={3} onToggleExpand={vi.fn()} />)

    expect(screen.getByText('protein binding').closest('a')).toHaveAttribute(
      'href',
      `${config.AMIGO_TERM_URL}GO:0005515`
    )
    expect(screen.getByText('Unknown molecular function').closest('a')).toBeNull()
  })

  it('explains the evidence behind each term on hover', async () => {
    const { user } = renderWithProviders(
      <Terms terms={terms} maxTerms={3} onToggleExpand={vi.fn()} />
    )

    await user.hover(evidenceIcon('protein binding'))
    expect(
      await screen.findByText(EVIDENCE_TYPE_MAP[EvidenceType.DIRECT].iconTooltip)
    ).toBeInTheDocument()

    await user.unhover(evidenceIcon('protein binding'))
    await user.hover(evidenceIcon('enzyme binding'))
    expect(
      await screen.findByText(EVIDENCE_TYPE_MAP[EvidenceType.HOMOLOGY].iconTooltip)
    ).toBeInTheDocument()
  })
})
