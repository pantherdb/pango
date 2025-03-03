import { setLeftDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import type React from 'react'
import { useEffect } from 'react'
import { useAppDispatch } from './hooks'
import { ENVIRONMENT } from '@/@pango.core/data/constants'
import { FaFlask } from 'react-icons/fa'
import { TbBinaryTreeFilled } from 'react-icons/tb'

const AboutPage: React.FC = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setLeftDrawerOpen(false))
  }, [dispatch])

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 py-6">
      <div className="mx-auto flex w-full flex-col items-stretch p-4 md:max-w-6xl">
        <div className="mb-4 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-800 md:text-4xl">
            About the PAN-GO human gene functionome
          </h1>
        </div>

        <div className="mb-10">
          <p className="mt-2 text-xl font-semibold text-green-600">Version: 1.0</p>
          <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600">
            <li>GO annotations and ontology from GO release 2022-03-22</li>
            <li>Phylogenetic trees from PANTHER version 15.0</li>
            <li>All data can be downloaded from the Downloads menu in the header.</li>
          </ul>
        </div>

        <div className="mb-10 space-y-6">
          <p className="leading-relaxed text-gray-700">
            The PAN-GO functionome is the set of all annotated functional characteristics ("Gene
            Ontology annotations") for human protein-coding genes, as determined by the PAN-GO
            (Phylogenetic ANnotation using Gene Ontology) project, a collaboration between the{' '}
            <a
              className="font-medium"
              href="http://geneontology.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gene Ontology Consortium
            </a>{' '}
            and the{' '}
            <a
              className="font-medium"
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
            <span className="inline-flex items-center font-bold text-black">
              flask icon <FaFlask className="ml-1 text-xl" />
            </span>
            ; otherwise it is labeled with a{' '}
            <span className="inline-flex items-center font-bold text-black">
              tree icon <TbBinaryTreeFilled className="ml-1 text-xl" />
            </span>{' '}
            (for homology-based). The list of publications providing the experimental evidence is
            provided for each annotation.
          </p>

          <div className="rounded-md bg-gray-50 p-4">
            <p className="leading-relaxed text-gray-700">
              A detailed description of the process used to create the PAN-GO functionome, as well
              as an analysis of its contents, has been published in:
              <br />
              <span className="mt-2 block font-medium">
                <a
                  className="font-medium"
                  href={ENVIRONMENT.paperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Feuermann et al., A compendium of human gene functions derived from evolutionary
                  modelling, <span className="italic">Nature</span> 2025.{' '}
                </a>
              </span>
            </p>
          </div>

          <p className="leading-relaxed text-gray-700">
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
              className="font-medium"
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
