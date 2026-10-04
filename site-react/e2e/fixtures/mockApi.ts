import type { BrowserContext } from '@playwright/test'

/**
 * Canned GraphQL responses for the e2e suite. Every request to `/graphql` is answered here (the
 * public API blocks headless browsers, and tests must not depend on live data), and each call is
 * recorded so specs can assert what the app asked for.
 */

const MF = 'molecular function'
const BP = 'biological process'
const CC = 'cellular component'

const bucket = (
  id: string,
  label: string,
  aspect: string,
  docCount: number,
  parentIds?: string[]
) => ({
  key: label,
  docCount,
  meta: { id, label, aspect, displayId: id.startsWith('UNKNOWN') ? '' : id, parentIds },
})

export const categories = [
  bucket('GO:0003824', 'catalytic activity', MF, 4500),
  bucket('GO:0005215', 'transporter activity', MF, 1200),
  bucket('GO:0060089', 'molecular transducer activity', MF, 900),
  bucket('UNKNOWN:0001', 'Unknown molecular function', MF, 8734),
  bucket('GO:0023052', 'signaling', BP, 3000),
  bucket('GO:0002376', 'immune system process', BP, 1500),
  bucket('UNKNOWN:0002', 'Unknown biological process', BP, 5000),
  bucket('GO:0005634', 'nucleus', CC, 6000),
  bucket('GO:0005886', 'plasma membrane', CC, 3500),
  bucket('UNKNOWN:0003', 'Unknown cellular component', CC, 2000),
]

const term = (id: string, label: string, aspect: string, evidenceType = 'direct') => ({
  id,
  label,
  aspect,
  displayId: id,
  isGoslim: false,
  evidenceType,
})

const geneNames = [
  ['TP53', 'Cellular tumor antigen p53'],
  ['BRCA1', 'Breast cancer type 1 susceptibility protein'],
  ['EGFR', 'Epidermal growth factor receptor'],
  ['MYC', 'Myc proto-oncogene protein'],
  ['PTEN', 'Phosphatase and tensin homolog'],
]

export const GENE_TOTAL = 19532

export const genes = Array.from({ length: 20 }, (_, i) => {
  const [geneSymbol, geneName] = geneNames[i % geneNames.length]
  return {
    gene: `UniProtKB:P0${4637 + i}`,
    geneName,
    geneSymbol,
    namedGene: true,
    longId: `HUMAN|HGNC=${11998 + i}|UniProtKB=P0${4637 + i}`,
    pantherFamily: `PTHR1${1447 + i}`,
    coordinatesChrNum: String((i % 22) + 1),
    coordinatesStart: 7661779 + i * 1000,
    coordinatesEnd: 7687538 + i * 1000,
    coordinatesStrand: -1,
    terms: [
      term('GO:0003700', 'DNA-binding transcription factor activity', MF),
      term('GO:0005515', 'protein binding', MF, 'homology'),
      term('GO:0019899', 'enzyme binding', MF),
      term('GO:0006915', 'apoptotic process', BP),
      term('GO:0005634', 'nucleus', CC),
    ],
    slimTerms: [term('GO:0003824', 'catalytic activity', MF)],
  }
})

const annotation = (
  t: ReturnType<typeof term>,
  slim: ReturnType<typeof term>,
  evidenceType: string
) => ({
  gene: 'UniProtKB:P04637',
  geneName: 'Cellular tumor antigen p53',
  geneSymbol: 'TP53',
  namedGene: true,
  longId: 'HUMAN|HGNC=11998|UniProtKB=P04637',
  pantherFamily: 'PTHR11447',
  taxonAbbr: 'HUMAN',
  taxonId: 'NCBITaxon:9606',
  coordinatesChrNum: '17',
  coordinatesStart: 7661779,
  coordinatesEnd: 7687538,
  coordinatesStrand: -1,
  term: { ...t, isGoslim: false },
  termType: t.id.startsWith('UNKNOWN') ? 'unknown' : 'known',
  slimTerms: [{ ...slim, isGoslim: true }],
  evidenceType,
  evidence: [
    {
      withGeneId:
        evidenceType === 'homology'
          ? {
              gene: 'UniProtKB:P02340',
              geneName: 'Cellular tumor antigen p53',
              geneSymbol: 'Tp53',
              taxonAbbr: 'MOUSE',
              taxonId: 'NCBITaxon:10090',
              taxonLabel: 'Mus musculus',
            }
          : null,
      references: [
        {
          pmid: 'PMID:20959462',
          title: 'p53 and its mutants in tumor cell migration and invasion.',
          date: '2010',
          authors: ['Muller PA', 'Vousden KH'],
        },
      ],
    },
  ],
  groups: ['GO_Central'],
})

const catalytic = term('GO:0003824', 'catalytic activity', MF)
const signaling = term('GO:0023052', 'signaling', BP)
const nucleus = term('GO:0005634', 'nucleus', CC)

/** TP53's annotations: five known functions and one unknown aspect. */
export const annotations = [
  annotation(
    term('GO:0003700', 'DNA-binding transcription factor activity', MF),
    catalytic,
    'direct'
  ),
  annotation(term('GO:0005515', 'protein binding', MF), catalytic, 'homology'),
  annotation(term('GO:0006915', 'apoptotic process', BP), signaling, 'direct'),
  annotation(term('GO:0006977', 'DNA damage response', BP), signaling, 'homology'),
  annotation(nucleus, nucleus, 'direct'),
  annotation(
    term('UNKNOWN:0003', 'Unknown cellular component', CC),
    term('UNKNOWN:0003', 'Unknown cellular component', CC),
    'n/a'
  ),
]

export const childTerms = (parentId: string) => [
  bucket('GO:0004672', 'protein kinase activity', MF, 520, [parentId]),
  bucket('GO:0016787', 'hydrolase activity', MF, 410, [parentId]),
  bucket('GO:0016740', 'transferase activity', MF, 120, [parentId]),
]

interface GraphqlBody {
  query?: string
  variables?: { filterArgs?: { slimTermIds?: string[] } } & Record<string, unknown>
}

const respond = ({ query = '', variables = {} }: GraphqlBody): Record<string, unknown> => {
  if (query.includes('geneStats('))
    return { geneStats: { slimTermFrequency: { buckets: categories } } }
  if (query.includes('genesCount(')) return { genesCount: { total: GENE_TOTAL } }
  if (query.includes('autocomplete(')) {
    return {
      autocomplete: genes
        .slice(0, 3)
        .map(({ gene, geneName, geneSymbol }) => ({ gene, geneName, geneSymbol })),
    }
  }
  if (query.includes('termStats(')) {
    const ids = variables.filterArgs?.slimTermIds ?? []
    return { termStats: { termFrequency: { buckets: childTerms(ids[ids.length - 1]) } } }
  }
  if (query.includes('annotations(')) return { annotations }
  if (query.includes('genes(')) return { genes }
  return {}
}

export interface GraphqlCall {
  operation: string
  variables: Record<string, unknown>
  /** The `X-API-Version` header the app sent. */
  apiVersion?: string
}

export class ApiMock {
  readonly calls: GraphqlCall[] = []

  /** Variables of the most recent call to a GraphQL operation (e.g. 'GetGenes'). */
  lastVariables(operation: string) {
    return this.calls.filter(call => call.operation === operation).at(-1)?.variables
  }
}

export const installApiMock = async (context: BrowserContext): Promise<ApiMock> => {
  const api = new ApiMock()

  // Keep the suite offline: analytics and any other third-party request gets an empty response.
  await context.route(
    url => !['localhost', '127.0.0.1'].includes(url.hostname),
    route => route.fulfill({ status: 204 })
  )

  // Registered last, so it takes precedence over the catch-all above.
  await context.route('**/graphql', async route => {
    const body = (route.request().postDataJSON() ?? {}) as GraphqlBody
    const operation = /query\s+(\w+)/.exec(body.query ?? '')?.[1] ?? 'unknown'
    api.calls.push({
      operation,
      variables: body.variables ?? {},
      apiVersion: route.request().headers()['x-api-version'],
    })
    await route.fulfill({ json: { data: respond(body) } })
  })

  return api
}
