import { ENVIRONMENT } from '@/@pango.core/data/constants';
import type React from 'react';
import ontology from '@/@pango.core/data/ontologyOptions.json';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'overrep-form': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'submit-url'?: string;
        'species'?: string;
        'test-type'?: string;
        'textarea-rows'?: string;
        'submit-label'?: string;
        'examples-label'?: string;
        'gene-ids-label'?: string;
        'ontology-label'?: string;
        'hint'?: string;
        'show-hint'?: boolean;
        ontologyOptions?: any;
        exampleGenes?: any;
      }, HTMLElement>;
    }
  }
}


const OverrepForm = () => {

  const ontologyOptions = ontology.ontology;
  const exampleGenes = ontology.genes;
  const submitUrl = ENVIRONMENT.overrepApiUrl;
  return (
    <overrep-form
      submit-url={submitUrl}
      species="HUMAN"
      test-type="FISHER"
      textarea-rows="3"
      style={{
        '--overrep-height': '270px',
        '--overrep-width': '100%',
        '--overrep-font-size': '12px'
      } as React.CSSProperties}
      ontologyOptions={ontologyOptions}
      exampleGenes={exampleGenes}
    />
  );
};

export default OverrepForm;