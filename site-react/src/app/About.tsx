import type React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="pango-body pango-section section-1">
        <div className="pango-container pango-sm-container flex flex-col items-stretch">
          <h1 className="text-2xl font-bold mb-4">About page</h1>

          <h2 className="text-xl font-semibold mb-2">About the human gene functionome</h2>

          <p className="mb-4">
            The functionome is the set of all annotated functional characteristics ("annotations") for human
            protein-coding genes, as determined by the PAN-GO (Phylogenetic ANnotation using Gene Ontology) project
            <a className="text-blue-500" href="#">[link to paper when available]</a>, a collaboration between the{' '}
            <a
              className="text-blue-500"
              href="http://geneontology.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gene Ontology Consortium
            </a>{' '}
            and the{' '}
            <a
              className="text-blue-500"
              href="https://www.pantherdb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PANTHER
            </a>{' '}
            evolutionary tree resource. Each gene in the human genome has been “annotated” with one or more terms from
            the Gene Ontology, and therefore each annotation represents a functional characteristic of a protein that is
            encoded by that gene. Each annotation is the result of expert biologist review, based on integration of
            experimental data for related genes, using explicit evolutionary modeling. All annotations can be traced to
            the experimental data supporting them, which is broadly categorized as “direct” evidence (including
            experimental evidence for the human gene itself) or “homology” evidence (based on experimental evidence for a
            related gene).
          </p>

          <p className="mb-4">
            The gene table shows the functional characteristics (expressed as Gene Ontology terms) for each gene. It
            shows two annotated GO terms by default, and can be expanded to show all (click on the triangle to the left
            of the gene symbol). The GO term label is shown, and you can get additional information of the term,
            including a detailed definition, by clicking on the GO identifier (e.g. GO:0005737). Evidence for each
            characteristic is shown by the flask icon, labeled with either D (direct) or H (homology).
          </p>

          <h3 className="text-lg font-semibold mb-2">The current functionome website is designed to support three main use-cases:</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li className="mb-2">
              <strong>Find all functional characteristics for a gene of interest.</strong> Type the gene symbol, name, or
              identifier into the “filter by gene” box, and select your gene from the autocomplete. To get detailed
              information about a gene, including evidence for its functional characteristics, click on the gene symbol,
              or on “View all functions and evidence”.
            </li>
            <li className="mb-2">
              <strong>Explore the human genome by functional category, and find all genes in a given category of functional characteristic.</strong>{' '}
              Browse the bar chart of categories in the left panel, and click to filter the list of genes to include only
              those in the selected functional category. You can then read more about each gene, and follow links to
              additional information about that gene.
            </li>
            <li>
              <strong>Find all genes that have not yet been associated with any functional characteristics</strong>, for a given
              type of characteristic. Find these in the bar chart on the left panel. You can click to select “Unknown
              molecular function”, “Unknown biological process” or “Unknown Cellular Component” to find genes that
              currently have no PAN-GO annotations describing that aspect of their function.
            </li>
          </ol>

          <h3 className="text-lg font-semibold mb-2">Important details:</h3>
          <ol className="list-decimal pl-6 mb-4">
            <li className="mb-2">
              <h4 className="text-md font-bold">EVIDENCE for annotations:</h4>
              <p className="mb-2">
                All annotations are based on experimental evidence, which is shown in the table. This evidence may
                include a direct experiment on the human gene itself (“direct” evidence) or may only include experiments
                on a homologous, i.e. evolutionarily related, gene (“homology” evidence). Note that all annotations are
                the result of integrated review and explicit evolutionary modeling using phylogenetic trees.
              </p>
              <p>
                Click on the “View all functions and evidence” link to see details of the evidence, including a link to
                the publications that report the experimental evidence. Evidence for each annotated functional
                characteristic is organized by the gene for which the experimental evidence was obtained, which can be
                either a human gene (labeled Hsa, for Homo sapiens) or another organism (click on the link to get
                information about the species).
              </p>
            </li>
            <li className="mb-2">
              <h4 className="text-md font-bold">ACCURACY AND COMPLETENESS of annotations:</h4>
              <p>
                Annotations are updated regularly. If you see an incorrect annotation, or cannot find an annotation that
                should be included, please click on the Help link and report it. When suggesting a new annotation, please
                include a link to the publication that provides experimental evidence.
              </p>
            </li>
            <li>
              <h4 className="text-md font-bold">GO FUNCTION CATEGORIES:</h4>
              <p className="mb-2">
                Annotation categories are relatively high-level GO terms, and each annotated GO term is assigned to one
                (or sometimes more) category using the structure of GO.
              </p>
              <ol className="list-lower-alpha pl-6 mb-2">
                <li className="mb-1">
                  You can browse the list (bar chart) of categories in the left panel, and click on a category to select
                  it. To filter the categories to a specific aspect of GO function (molecular function, biological
                  process, cellular component), click on a button above the bar chart.
                </li>
                <li className="mb-1">
                  Annotation categories do not cover all GO term annotations. If an annotated GO term is not in any of
                  the categories, the annotation will be assigned to other molecular function, other biological process,
                  or other cellular component.
                </li>
                <li className="mb-1">
                  Some categories are subcategories of others. In this case, to make the categories more useful, we assign
                  an annotation only to its <strong>most specific category</strong>. This means that filtering by the
                  larger category will filter out genes that are in a subcategory, and you will have to select the
                  subcategory separately to review these.
                </li>
              </ol>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
