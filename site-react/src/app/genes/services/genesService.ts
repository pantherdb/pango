import { GOAspect } from "../models/gene";

export const transformGenes = (genes: any[]) => {
  const groupTerms = (terms: any[]) => {
    return terms.reduce((acc, term) => {
      const aspect = term.aspect?.toLowerCase();
      if (!acc[aspect]) {
        acc[aspect] = [];
      }
      acc[aspect].push(term);
      return acc;
    }, {});
  };

  return genes.map(gene => {
    const groupedTerms = groupTerms(gene.terms);
    return {
      ...gene,
      mfs: groupedTerms[GOAspect.MOLECULAR_FUNCTION] || [],
      bps: groupedTerms[GOAspect.BIOLOGICAL_PROCESS] || [],
      ccs: groupedTerms[GOAspect.CELLULAR_COMPONENT] || [],
      maxTerms: 2,
      expanded: false
    };
  });
};