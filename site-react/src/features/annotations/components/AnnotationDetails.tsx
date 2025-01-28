import type React from "react";
import { ASPECT_MAP } from "@/@pango.core/data/config";
import type { Annotation } from "../models/annotation";


interface Props {
  annotation: Annotation;
}


export const AnnotationDetails: React.FC<Props> = ({ annotation }) => {

  console.log('Ann', annotation);
  const getAspectChip = (aspect: string) => {
    const aspectInfo = ASPECT_MAP[aspect];
    if (!aspectInfo) return null;

    return (
      <span
        className="ml-2 text-[10px] font-bold h-6 w-6 rounded border flex items-center justify-center"
        style={{
          borderColor: aspectInfo.color || undefined,
          color: aspectInfo.color || undefined,
        }}
      >
        {aspectInfo.shorthand}
      </span>
    );
  };

  if (!annotation) return null;

  return (
    <div className="flex flex-col w-full h-full max-w-[500px]">
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col w-full">
          <section className="border-b border-gray-400 p-2.5 text-xs">
            <div className="text-gray-600 text-lg font-bold py-3">Gene</div>
            <div className="py-1">
              <div className="font-bold text-xs">
                <a href={`/gene/${annotation.gene}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                  {annotation.gene}
                </a>
              </div>
              <div className="text-xs">{annotation.geneSymbol}</div>
              <div className="text-sm">{annotation.geneName}</div>
            </div>
          </section>

          <section className="border-b border-gray-400 p-2.5 text-xs">
            <div className="text-gray-600 text-lg font-bold py-3">Term</div>
            <div className="flex items-center font-bold text-xs">
              {annotation.term.id}
              {getAspectChip(annotation.term.aspect)}
            </div>
            <div className="text-xs mt-1">{annotation.term.label}</div>
          </section>

          <section className="border-b border-gray-400 p-2.5 text-xs">
            <div className="text-gray-600 text-lg font-bold py-3">GO Function Categories</div>
            {annotation.slimTerms.map((term, index) => (
              <div key={index} className="py-1">
                <div className="flex items-center font-bold text-xs">
                  {term.id}
                  {getAspectChip(term.aspect)}
                </div>
                <div className="text-xs mt-1">{term.label}</div>
              </div>
            ))}
          </section>

          <section className="border-b border-gray-400 p-2.5 text-xs">
            <div className="text-gray-600 text-lg font-bold py-3">Group</div>
            <div>{annotation.group}</div>
          </section>

          <section className="border-b border-gray-400 p-2.5 text-xs">
            <div className="flex items-center">
              <div className="text-gray-600 text-lg font-bold py-3">
                Evidence ({annotation.evidence?.length})
              </div>
            </div>
            {annotation.evidence.map((item, index) => (
              <div key={index} className="py-1">
                <div>
                  {item.withGeneId?.gene} ({item.withGeneId?.geneSymbol})<br />
                  ({item.withGeneId?.geneName})
                </div>
                {item.references?.map((reference, refIndex) => (
                  <div key={refIndex} className="pl-8 py-1">
                    <div className="font-bold text-xs">{reference.pmid}</div>
                    <div className="text-xs">{reference.title}</div>
                    <div className="text-sm">{reference.date}</div>
                    {reference.authors.map((author, authorIndex) => (
                      <div key={authorIndex} className="text-xs">
                        {author}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AnnotationDetails;