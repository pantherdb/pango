import { ENVIRONMENT } from '@/@pango.core/data/constants'
import type React from 'react'

const HelpPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 py-6">
      <div className="mx-auto flex w-full flex-col items-stretch p-4 md:max-w-5xl">
        <header className="mb-4 border-b border-gray-200 pb-6">
          <h1 className="mb-3 text-2xl font-bold text-gray-800 md:text-4xl">
            Tips for using the PAN-GO Functionome website
          </h1>
          <p className="text-gray-600">
            Pages on the website include many tooltips for guidance. Try hovering your mouse over
            areas for explanations.
          </p>
        </header>

        <div className="mb-10">
          <h2 className="mb-4 border-b border-primary-300 pb-2 text-xl font-bold text-primary-500 md:text-2xl">
            The home page has a header and two panels.
          </h2>

          <div className="mb-4">
            <div className="mb-3">
              <h3 className="inline text-lg font-semibold text-gray-800">The header</h3>
              <span className="ml-2 rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-800">
                (box with blue background)
              </span>
            </div>
            <p className="mb-3 text-gray-700">
              Has two boxes for searching or using the PAN-GO functionome annotations:
            </p>
            <ul className="ml-8 list-disc space-y-3">
              <li className="text-gray-700">
                A box for finding functions of a specific gene. Start typing and select from the
                autocomplete. This will take you to the gene page for the selected gene.
              </li>
              <li className="text-gray-700">
                A larger box where you can type or paste a list of genes to perform a statistical{' '}
                <a
                  className="font-medium"
                  href={ENVIRONMENT.overrepDocsApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GO enrichment analysis
                </a>{' '}
                of the list and find overrepresented GO terms. This box does not have autocomplete.
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                The right panel (below the header)
              </h3>
            </div>
            <p className="mb-3 text-gray-700">
              Is a list of human genes, and all their functional characteristics represented in the
              PAN-GO functionome (if there are many characteristics, you need to click to see them
              all).
            </p>
            <ul className="ml-8 list-disc space-y-3">
              <li className="text-gray-700">
                You can get detailed information about a gene and its functions (including evidence)
                by clicking on the gene name in the GENE column (e.g.{' '}
                <span className="font-mono">ABCD3</span>), or the link to View all annotations and
                details.
              </li>
              <li className="text-gray-700">
                Each characteristic (GO term) is labeled with the type of evidence used to support
                that characteristic– either a direct experiment, or an experiment on a related gene
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-800">The left panel</h3>
            </div>
            <p className="mb-3 text-gray-700">
              Is a graphical overview of the high level function categories for the genes in the
              right panel.
            </p>
            <ul className="ml-8 list-disc space-y-3">
              <li className="text-gray-700">
                The graph is interactive: clicking on a category will filter the genes in the right
                panel to only show genes in that category, and recalculate the graph based on the
                current selection.
              </li>
              <li className="text-gray-700">
                The graph can be modified to show only categories from one, two or three "aspects"
                of GO terms, e.g. clicking on the button marked{' '}
                <span className="font-bold">MF</span> will toggle between showing/hiding GO
                molecular function terms. This will not change the list of genes in the right panel,
                and only affects the bars shown in the graph.
              </li>
              <li className="text-gray-700">
                The categories are high level GO terms (GO subsets) that categorize the exact GO
                terms that are annotated in the right panel. In most cases they represent a broader
                concept compared to the exact annotations shown in the right panel (the relationship
                is shown on the gene details page).
              </li>
              <li className="text-gray-700">
                You can filter by multiple categories, for example to find all genes with "protein
                kinase activity" that function in the "cytosol", or all genes with both "unknown
                molecular function" and "unknown biological process".
              </li>
              <li className="text-gray-700">
                If you don't find a gene in an expected category, it may be in a more specific
                category instead. Each gene is assigned to the most specific category possible, in
                order to minimize overlap between categories.
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="mb-4 border-b border-primary-300 pb-2 text-xl font-bold text-primary-500 md:text-2xl">
            The gene page has multiple sections:
          </h2>

          <div className="mb-4">
            <h3 className="mb-3 text-lg font-semibold text-gray-800">Gene information</h3>
            <p className="mb-3 text-gray-700">
              Besides the gene name and description of the protein encoded by the gene, there are
              also links to explore:
            </p>
            <ul className="ml-8 list-disc space-y-3">
              <li className="text-gray-700">
                <span className="font-medium text-black">"GO annotations from all sources":</span>{' '}
                links to the GO AmiGO browser which includes not only the PAN-GO annotations, but
                all other GO annotations in the GO knowledgebase for that gene. These are generally
                redundant with the PAN-GO annotations, or represent more indirect effects rather
                than core functions.
              </li>
              <li className="text-gray-700">
                <span className="font-medium text-black">
                  "PAN-GO evolutionary model for this family":
                </span>{' '}
                links to the evolutionary model used to assign the PAN-GO annotations.
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="mb-3 text-lg font-semibold text-gray-800">External links</h3>
            <p className="text-gray-700">
              {' '}
              to additional information about the gene at some other useful resources..
            </p>
          </div>

          <div className="mb-4">
            <h3 className="mb-3 text-lg font-semibold text-gray-800">Function summary</h3>
            <p className="text-gray-700">
              Similar to the summary on the home page right panel, it shows the GO terms
              representing the functional characteristics of the gene assigned in the PAN-GO
              functionome.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">Function details</h3>
            <p className="mb-3 text-gray-700">
              Shows detailed information about each functional characteristic of the gene in the
              Function summary.
            </p>
            <ul className="ml-8 list-disc space-y-4">
              <li className="text-gray-700">
                <span className="font-semibold text-black">Category.</span> The higher level
                category (a GO term from the GO 'generic subset' ) for the assigned GO term in the
                first column. Note that terms with multiple parents in different GO branches will be
                in more than one high level category.
              </li>
              <li className="text-gray-700">
                <span className="font-semibold text-black">Evidence.</span> The evidence for the
                assigned GO term in the first column. The evidence can be from experiments directly
                for the human gene, and/or experiments in other organisms. Evidence is organized by
                the gene (and organism) that was experimentally determined to have the given
                functional characteristic. For each gene in the list, each scientific paper
                demonstrating that function is listed. You can click to see that paper in PubMed.
                <ul className="ml-8 mt-3 list-disc space-y-2">
                  <li className="text-gray-700">
                    Organisms are listed by a simple code, with the first letter of the genus,
                    followed by the first two letters of the species, e.g. human is{' '}
                    <span className="font-mono font-semibold">Hsa</span> for Homo sapiens. If the
                    three letter code is unfamiliar, click on it to get more information at the NCBI
                    Taxonomy website.
                  </li>
                </ul>
              </li>
              <li className="text-gray-700">
                <span className="font-medium text-black">Contributors.</span> These are the GO
                Consortium groups that created the experimental annotations from the papers listed
                in the Evidence column. These experimental annotations were used to support the
                PAN-GO annotations.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpPage
