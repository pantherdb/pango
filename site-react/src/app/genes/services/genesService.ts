import { ASPECT_MAP } from "@/@pango.core/data/config";
import type { Bucket, CategoryItem, Gene, GroupedTerms } from "../models/gene";
import { GOAspect } from "../models/gene";


const groupTermsByAspect = (terms: any[]) => {
  return terms.reduce((acc, term) => {
    const aspect = term.aspect?.toLowerCase();
    if (!acc[aspect]) {
      acc[aspect] = [];
    }
    acc[aspect].push(term);
    return acc;
  }, {});
};

export const transformTerms = (terms: any[], maxTerms = 2): GroupedTerms => {
  const grouped = groupTermsByAspect(terms);
  return {
    mfs: grouped[GOAspect.MOLECULAR_FUNCTION] || [],
    bps: grouped[GOAspect.BIOLOGICAL_PROCESS] || [],
    ccs: grouped[GOAspect.CELLULAR_COMPONENT] || [],
    maxTerms,
    expanded: false
  };
};

export const transformGenes = (genes: any[]): Gene[] => {
  return genes.map(gene => {
    const grouped = groupTermsByAspect(gene.terms);

    const groupedTerms: GroupedTerms = {
      mfs: grouped[GOAspect.MOLECULAR_FUNCTION] || [],
      bps: grouped[GOAspect.BIOLOGICAL_PROCESS] || [],
      ccs: grouped[GOAspect.CELLULAR_COMPONENT] || [],
      maxTerms: 2,
      expanded: false
    }
    return {
      ...gene,
      groupedTerms
    };
  });
};

export const buildCategoryBar = (buckets: Bucket[], selectedAspects: string[]): CategoryItem[] => {
  if (!buckets?.length) return [];

  const filteredBuckets = buckets.filter(bucket =>
    selectedAspects.includes(bucket.meta.aspect)
  );

  const sortedBuckets = [...filteredBuckets].sort((a, b) => b.docCount - a.docCount);
  const longest = sortedBuckets[0]?.docCount || 0;

  return sortedBuckets.map((bucket) => {
    const ratio = bucket.docCount / longest;
    const countPos = ratio < 0.20 ? `${ratio * 100}%`
      : ratio < 0.90 ? `${(ratio - 0.15) * 100}%`
        : `${(ratio - 0.30) * 100}%`;

    return {
      ...bucket.meta,
      name: bucket.key,
      count: bucket.docCount,
      color: ASPECT_MAP[bucket.meta.aspect]?.color,
      aspectShorthand: ASPECT_MAP[bucket.meta.aspect]?.shorthand,
      width: `${ratio * 100}%`,
      countPos
    };
  });
};