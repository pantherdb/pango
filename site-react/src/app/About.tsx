import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import type React from 'react'
import { useEffect } from 'react'
import { useAppDispatch } from './hooks'
import { ENVIRONMENT } from '@/@pango.core/data/constants'

const AboutPage: React.FC = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setLeftDrawerOpen(false))
  }, [dispatch])

  // TODO: Change links to actual paper links

  return (
    <div className="min-h-screen w-full bg-gray-50 pt-14">
      <div className="mx-auto flex w-full flex-col items-stretch p-5 sm:max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">About the PAN-GO human gene functionome</h1>

        <div className="mb-6">
          <p className="font-semibold">Version: 1.0</p>
        </div>

        <ul className="mb-6 list-disc space-y-1 pl-6">
          <li>GO annotations and ontology from GO release 2022-03-22</li>
          <li>Phylogenetic trees from PANTHER version 15.0</li>
          <li>All data can be downloaded from the Downloads menu in the header.</li>
        </ul>

        <div className="space-y-4">
          <p>
            The PAN-GO functionome is the set of all annotated functional characteristics ("Gene
            Ontology annotations") for human protein-coding genes, as determined by the PAN-GO
            (Phylogenetic ANnotation using Gene Ontology) project, a collaboration between the{' '}
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
            evolutionary tree resource. Each annotation is the result of expert biologist review,
            based on integration of experimental data for related genes using explicit evolutionary
            modeling. The evidence supporting each annotation is based on an experiment performed on
            the human gene itself, or on an evolutionarily related (homologous) gene, or both. If
            there is direct evidence for the human gene, the annotation is labeled with a{' '}
            <span className="font-bold">flask icon</span>; otherwise it is labeled with a{' '}
            <span className="font-bold">tree icon</span> (for homology-based). The list of
            publications providing the experimental evidence is provided for each annotation.
          </p>

          <p>
            A detailed description of the process used to create the PAN-GO functionome, as well as
            an analysis of its contents, has been published in:
            <br />
            Feuermann et al., A compendium of human gene functions derived from evolutionary
            modelling, 2025.
          </p>

          <p>
            The PAN-GO functionome is designed to be as accurate and comprehensive as possible,
            while also being concise (a minimally redundant set of GO terms for each gene). To
            create PAN-GO, we have integrated all available annotations in the GO knowledgebase,
            which were drawn from experimental results reported in about 175,000 scientific
            publications. The set of PAN-GO annotations refers to evidence from more than 56,000 of
            these publications that provided the most direct and relevant data. Despite the large
            number of publications reviewed in this version, the PAN-GO functionome may be missing
            some functional characteristics that have been experimentally verified, and we encourage
            the scientific community to{' '}
            <a
              className="text-blue-500"
              href={ENVIRONMENT.contactUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              suggest improvements
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
