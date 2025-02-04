import { ENVIRONMENT } from '@/@pango.core/data/constants';
import type React from 'react';
import type { Term } from '../models/term';

interface TermLinkProps {
  term: Term
}

const TermLink: React.FC<TermLinkProps> = ({ term }) => {
  return term.displayId ? (
    <a href={ENVIRONMENT.amigoTermUrl + term.id}
      target="_blank"
      rel="noopener noreferrer" className="no-underline">
      {term.label}
    </a>
  ) : (
    <span>{term.label}</span>
  );
};

export default TermLink;