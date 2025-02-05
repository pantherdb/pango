import { ENVIRONMENT } from '@/@pango.core/data/constants';
import type React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="footer flex flex-row items-start p-5 py-10 bg-gradient-to-r from-[#0e2a3b] to-[#34306b] text-white">
      <div className="flex flex-row items-start flex-1">
        <div className="mr-4">
          <Link to="/" className="text-white">Home</Link>
        </div>
        <div className="mr-4">
          <a href={ENVIRONMENT.contactUrl} className="text-white" target="_blank" rel="noopener noreferrer">Contact us</a>
        </div>
      </div>
      <span className="flex-grow"></span>
      <div className="text-right flex-1">
        <small>
          Copyright © {currentYear} The Gene Ontology Consortium is supported by a U24 grant from the National Institutes
          of Health [grant U24 HG012212]
        </small>
      </div>
    </div>
  );
};

export default Footer;