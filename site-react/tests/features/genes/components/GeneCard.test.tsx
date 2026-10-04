import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MotionGlobalConfig } from 'framer-motion'
import { renderWithProviders } from '@tests/test-utils'
import { buildGene, buildTerm } from '@tests/fixtures/builders'
import { AspectType } from '@/@pango.core/data/config'
import { getConfig } from '@/@pango.core/data/constants'
import GeneCard from '@/features/genes/components/GeneCard'

const config = getConfig()

const gene = buildGene({
  groupedTerms: {
    mfs: [
      buildTerm(),
      buildTerm({ id: 'GO:0019899', label: 'enzyme binding', displayId: 'GO:0019899' }),
    ],
    bps: [
      buildTerm({
        id: 'GO:0006915',
        label: 'apoptotic process',
        displayId: 'GO:0006915',
        aspect: AspectType.BIOLOGICAL_PROCESS,
      }),
    ],
    ccs: [],
    maxTerms: 2,
    expanded: false,
  },
})

const tab = (label: string) => screen.getByText(label, { selector: 'button' })

describe('GeneCard', () => {
  // Tab content animates in and out with framer-motion; finish animations immediately.
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true
  })

  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false
  })

  it('shows the gene with links to its page, UniProt and the UCSC browser', () => {
    renderWithProviders(<GeneCard gene={gene} />)

    expect(screen.getByText('TP53').closest('a')).toHaveAttribute('href', '/gene/UniProtKB:P04637')
    expect(screen.getByText('Cellular tumor antigen p53')).toBeInTheDocument()
    expect(screen.getByText('View all functions and evidence').closest('a')).toHaveAttribute(
      'href',
      '/gene/UniProtKB:P04637'
    )
    expect(screen.getByText('UniProtKB:P04637').closest('a')).toHaveAttribute(
      'href',
      'https://www.uniprot.org/uniprotkb/P04637'
    )
    expect(screen.getByText('chr17:7661779-7687538').closest('a')).toHaveAttribute(
      'href',
      `${config.UCSC_URL}17:7661779-7687538`
    )
  })

  it('leaves out the UCSC link when the gene has no coordinates', () => {
    renderWithProviders(<GeneCard gene={buildGene({ coordinatesChrNum: '' })} />)

    expect(screen.queryByText(/UCSC Browser/)).not.toBeInTheDocument()
  })

  it('counts the terms of each aspect on its tab and starts with them hidden', () => {
    renderWithProviders(<GeneCard gene={gene} />)

    expect(tab('Molecular Function (2)')).toBeInTheDocument()
    expect(tab('Biological Process (1)')).toBeInTheDocument()
    expect(tab('Cellular Component (0)')).toBeInTheDocument()
    expect(screen.queryByText('protein binding')).not.toBeInTheDocument()
  })

  it('shows the terms of the chosen aspect and hides them when it is chosen again', async () => {
    const { user } = renderWithProviders(<GeneCard gene={gene} />)

    await user.click(tab('Molecular Function (2)'))
    expect(await screen.findByText('protein binding')).toBeInTheDocument()
    expect(screen.getByText('enzyme binding')).toBeInTheDocument()
    expect(screen.queryByText('apoptotic process')).not.toBeInTheDocument()

    await user.click(tab('Molecular Function (2)'))
    await waitFor(() => expect(screen.queryByText('protein binding')).not.toBeInTheDocument())
  })

  it('switches between aspects', async () => {
    const { user } = renderWithProviders(<GeneCard gene={gene} />)

    await user.click(tab('Molecular Function (2)'))
    await user.click(tab('Biological Process (1)'))

    expect(await screen.findByText('apoptotic process')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('protein binding')).not.toBeInTheDocument())
  })

  it('groups every aspect that has terms under All', async () => {
    const { user } = renderWithProviders(<GeneCard gene={gene} />)

    await user.click(tab('All'))

    expect(
      await screen.findByText('Molecular Function (2)', { selector: 'h3' })
    ).toBeInTheDocument()
    expect(screen.getByText('Biological Process (1)', { selector: 'h3' })).toBeInTheDocument()
    expect(screen.queryByText('Cellular Component (0)', { selector: 'h3' })).not.toBeInTheDocument()
    expect(screen.getByText('protein binding')).toBeInTheDocument()
    expect(screen.getByText('apoptotic process')).toBeInTheDocument()
  })
})
