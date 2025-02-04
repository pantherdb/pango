import type { Annotation } from "@/features/annotations/models/annotation";
import { ENVIRONMENT } from "../data/constants";
import type { Gene } from "@/features/genes/models/gene";

export const getHGNC = (longId: string): string | null => {

  const pattern = /HGNC=(\d+)/;
  const matches = longId.match(pattern);

  if (matches && matches.length > 1) {
    return `HGNC:${matches[1]}`;
  }

  return null;

}

export const getUniprotLink = (gene: string) => {
  if (!gene) return ENVIRONMENT.uniprotUrl;

  const geneId = gene.split(':');
  return geneId.length > 1 ? `${ENVIRONMENT.uniprotUrl}${geneId[1]}` : ENVIRONMENT.uniprotUrl;
};

export const getFamilyLink = (element: Annotation) => {
  if (!element.pantherFamily || !element.longId) return ENVIRONMENT.pantherFamilyUrl;

  return `${ENVIRONMENT.pantherFamilyUrl}book=${encodeURIComponent(element.pantherFamily)}&seq=${encodeURIComponent(element.longId)}`;
};

export const getUCSCBrowserLink = (annotation: Annotation | Gene) => {
  if (!annotation.coordinatesChrNum || !annotation.coordinatesStart || !annotation.coordinatesEnd) return ENVIRONMENT.ucscUrl;

  return `${ENVIRONMENT.ucscUrl}${annotation.coordinatesChrNum}:${annotation.coordinatesStart}-${annotation.coordinatesEnd}`;
};

export const getAGRLink = (hgncId: string) => {
  if (!hgncId) return ENVIRONMENT.agrPrefixUrl;

  return ENVIRONMENT.agrPrefixUrl + hgncId;
}

export const getHGNCLink = (hgncId: string) => {
  if (!hgncId) return ENVIRONMENT.hgncPrefixUrl;

  return ENVIRONMENT.hgncPrefixUrl + hgncId;
}

