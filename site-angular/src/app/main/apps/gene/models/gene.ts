export class FilterArgs {
    keyword: string;
}

export class Gene {
    gene: string;
    term: string;
    slim_terms: string[];
    qualifiers: string[];
    reference: string;
}

export class Bucket {
    key: string
    docCount: number
}

export class Frequency {
    buckets: Bucket[]
}

export class AnnotationStats {
    termsFrequency: Frequency
}
