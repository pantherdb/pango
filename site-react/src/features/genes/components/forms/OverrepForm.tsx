import { ENVIRONMENT } from '@/@pango.core/data/constants'
import type React from 'react'
import ontology from '@/@pango.core/data/ontologyOptions.json'
import { useEffect, useRef } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'overrep-form': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'submit-url'?: string
          species?: string
          'test-type'?: string
          'textarea-rows'?: string
          'submit-label'?: string
          'examples-label'?: string
          'gene-ids-label'?: string
          'ontology-label'?: string
          hint?: string
          'show-hint'?: boolean
          ontologyOptions?: any
          exampleGenes?: any
        },
        HTMLElement
      >
    }
  }
}
const OverrepForm = () => {
  const formRef = useRef<any>(null)
  const ontologyOptions = ontology.ontology
  const exampleGenes = ontology.genes
  const submitUrl = ENVIRONMENT.overrepApiUrl

  useEffect(() => {
    if (formRef.current) {
      formRef.current.ontologyOptions = ontologyOptions
      formRef.current.exampleGenes = exampleGenes
    }
  }, [ontologyOptions, exampleGenes])

  return (
    <overrep-form
      ref={formRef}
      submit-url={submitUrl}
      species="HUMAN"
      examples-label="Load Example"
      test-type="FISHER"
      textarea-rows="3"
      style={
        {
          '--overrep-height': '280px',
          '--overrep-width': '100%',
          '--overrep-font-size': '12px',
          '--overrep-button-border-radius': '20px',
          '--overrep-button-width': '120px',
          '--overrep-button-height': '35px',
          '--overrep-button-border': '1px solid #BBBBBB',
          '--overrep-select-height': '36px',
          //'--overrep-primary-color': theme.palette.primary.main,
          '--overrep-hint-font-size': '10px',
          '--overrep-input-padding': '6px',
        } as React.CSSProperties
      }
    />
  )
}

export default OverrepForm
