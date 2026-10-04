import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { useConfig } from '@/@pango.core/data/useConfig'

const configAt = (route: string) =>
  renderHook(() => useConfig(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
  }).result.current

describe('useConfig', () => {
  it('uses the PANGO 2.0 resources by default', () => {
    const config = configAt('/')

    expect(config.APP_VERSION).toBe('2.0')
    expect(config.PANTREE_URL).toBe('https://pantree.functionome.org/tree/family.jsp?accession=')
    expect(config.DOWNLOAD_ALL_DATA_CSV_URL).toBe(
      'https://functionome.geneontology.org/download/export_annotations.zip'
    )
  })

  it('switches to the PANGO 1.0 resources for ?apiVersion=pango-1, keeping the shared links', () => {
    const config = configAt('/?apiVersion=pango-1')

    expect(config.APP_VERSION).toBe('1.0')
    expect(config.PANTREE_URL).toBe('https://pantree-v1.functionome.org/tree/family.jsp?accession=')
    expect(config.DOWNLOAD_ALL_DATA_CSV_URL).toBe(
      'https://functionome.geneontology.org/download/v1/export_annotations.zip'
    )
    expect(config.UNIPROT_URL).toBe('https://www.uniprot.org/uniprotkb/')
  })

  it('falls back to the default resources for an unknown ?apiVersion', () => {
    const config = configAt('/?apiVersion=pango-9')

    expect(config.APP_VERSION).toBe('2.0')
    expect(config.DOWNLOAD_ALL_DATA_CSV_URL).toBe(
      'https://functionome.geneontology.org/download/export_annotations.zip'
    )
  })
})
