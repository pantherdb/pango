import type React from 'react'
import { useEffect, useRef } from 'react'
import { useConfig } from '@/@pango.core/data/useConfig'
import ontology from '@/@pango.core/data/ontologyOptions.json'

/** The `<overrep-form>` web component (panther-overrep-form); list data is set as DOM properties. */
interface OverrepFormElement extends HTMLElement {
  ontologyOptions: typeof ontology.ontology
  exampleGenes: typeof ontology.genes
}

// React 19 looks intrinsic elements up on React.JSX, so the custom element is declared there.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'overrep-form': React.DetailedHTMLProps<
        React.HTMLAttributes<OverrepFormElement> & {
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
        },
        OverrepFormElement
      >
    }
  }
}

const OverrepForm = () => {
  const config = useConfig()
  const formRef = useRef<OverrepFormElement>(null)
  const ontologyOptions = ontology.ontology
  const exampleGenes = ontology.genes
  const submitUrl = config.OVERREP_API_URL

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
          '--overrep-hint-font-size': '10px',
          '--overrep-input-padding': '6px',
        } as React.CSSProperties
      }
    />
  )
}

export default OverrepForm
