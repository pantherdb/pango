interface FeedbackFormConfig {
  CONTACT_URL: string
  CONTACT_PREFILL_URL: string
}

// The Google Form fields the prefilled link fills with the gene symbol.
const GENE_FIELDS = ['entry.1624035027', 'entry.15683129', 'entry.168426483', 'entry.391072423']

/** Link to the annotation feedback form, prefilled with the gene when there is one. */
export const feedbackFormUrl = (config: FeedbackFormConfig, geneSymbol?: string): string => {
  if (!geneSymbol) return config.CONTACT_URL
  const value = encodeURIComponent(geneSymbol)
  return config.CONTACT_PREFILL_URL + GENE_FIELDS.map(field => `&${field}=${value}`).join('')
}
