import { TermEntry } from '../types';

/**
 * Clarivate Geneseq Rule:
 * Specific Technology Focus antibody/structural terms allowed in Sequence Specific Keywords (Col 8).
 * When used in SSKW, they MUST be prefixed with '@'.
 * Other Technology Focus keywords are strictly disallowed in SSKW and must not be considered.
 */
export const ALLOWED_TECH_IN_SSKW = [
  'heavy chain variable region',
  'light chain variable region',
  'heavy chain',
  'light chain',
  'heavy chain constant region',
  'light chain constant region',
  'chimeric protein',
  'fusion protein',
  'antibody',
  'humanized antibody',
  'single chain antibody',
  'single domain antibody',
  'nanobody',
  'chimeric antibody',
] as const;

export const ALLOWED_TECH_SSKW_SET = new Set<string>(
  ALLOWED_TECH_IN_SSKW.map((t) => t.toLowerCase())
);

/**
 * Normalizes an antibody / structure term, matching case, hyphens, and plural forms.
 * Returns the canonical lowercase term from ALLOWED_TECH_IN_SSKW if matched, or null otherwise.
 */
export function normalizeTechSskwTerm(term: string): string | null {
  if (!term) return null;
  const clean = term.replace(/^@+/, '').split('/')[0].trim().toLowerCase().replace(/-/g, ' ');
  if (ALLOWED_TECH_SSKW_SET.has(clean)) return clean;
  // Plural checks
  if (clean.endsWith('ies')) {
    const singular = clean.slice(0, -3) + 'y';
    if (ALLOWED_TECH_SSKW_SET.has(singular)) return singular;
  }
  if (clean.endsWith('s')) {
    const singular = clean.slice(0, -1);
    if (ALLOWED_TECH_SSKW_SET.has(singular)) return singular;
  }
  return null;
}

export function isAllowedTechInSskw(term: string): boolean {
  return normalizeTechSskwTerm(term) !== null;
}

export const INITIAL_TERM_LISTS = {
  Tech: [
    'Agriculture',
    'Antibody engineering',
    'Cell culture',
    'CRISPR',
    'Genome editing',
    'Transformation',
    'Vaccine',
    'heavy chain variable region',
    'light chain variable region',
    'heavy chain',
    'light chain',
    'heavy chain constant region',
    'light chain constant region',
    'chimeric protein',
    'fusion protein',
    'antibody',
    'humanized antibody',
    'single chain antibody',
    'single domain antibody',
    'nanobody',
    'chimeric antibody',
    'monoclonal antibody',
    'gene fusion',
    'plant',
    'coding sequence',
    'gene',
    'genome',
    'recombinant expression',
    'vector',
    'plasmid',
    'promoter',
    'enhancer',
    'expression cassette',
    'therapeutic',
    'protein engineering',
    'cell therapy',
  ],
  Disease: [
    'cancer /cytostatic',
    'autoimmune disease /immunosuppressive',
    'infectious disease /antimicrobial-gen.',
    'metastasis',
    'osteosarcoma /osteopathic',
    'leukemia /cytostatic',
    'lymphoma /cytostatic',
    'inflammation /antiinflammatory',
    'diabetes /antidiabetic',
    'cardiovascular disease',
    'neurodegenerative disease',
    'Alzheimer disease',
    'Parkinson disease',
    'pain /analgesic',
    'viral infection /antiviral',
    'bacterial infection /antibacterial',
  ],
  SS: [
    'PCR',
    'RT-PCR',
    'miRNA',
    'siRNA',
    'ds',
    'ss',
    'aptamer',
    'Variable region',
    'CD178',
    'primer',
    'probe',
    'cDNA',
    'signal peptide',
    'epitope',
    'epitope tag',
    'his-tag',
    'linker',
    'restriction site',
    'untranslated region',
    'polyadenylation signal',
  ],
  Gene: [
    'FASL',
    'CD24',
    'PDCD1',
    'CD274',
    'EGFR',
    'HER2',
    'TP53',
    'VEGFA',
    'KRAS',
    'TNF',
    'IL6',
    'CXCL8',
    'ACTB',
    'GAPDH',
  ],
  Protein: [
    'Fas ligand',
    'PD-1',
    'PD-L1',
    'epidermal growth factor receptor',
    'HER2 receptor',
    'p53 tumor suppressor',
    'vascular endothelial growth factor A',
    'tumor necrosis factor',
    'interleukin-6',
  ],
  Uncategorised: [
    'synthetic construct',
    'consensus sequence',
    'optimized sequence',
    'mutant',
    'variant',
  ],
};

export function createDefaultTermMap(): Map<string, TermEntry> {
  const map = new Map<string, TermEntry>();

  const addTerms = (list: string[], category: string) => {
    for (const item of list) {
      let term = item;
      let activity = '';
      if (item.includes('/')) {
        const parts = item.split('/');
        term = parts[0].trim();
        activity = parts[1].trim();
      }

      const lower = term.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, {
          original: term,
          preferred: '',
          activity,
          categories: new Set([category]),
        });
      } else {
        const existing = map.get(lower)!;
        existing.categories.add(category);
        if (activity && !existing.activity) {
          existing.activity = activity;
        }
      }
    }
  };

  addTerms(INITIAL_TERM_LISTS.Tech, 'Tech');
  addTerms(INITIAL_TERM_LISTS.Disease, 'Disease');
  addTerms(INITIAL_TERM_LISTS.SS, 'SS');
  addTerms(INITIAL_TERM_LISTS.Gene, 'Gene');
  addTerms(INITIAL_TERM_LISTS.Protein, 'Protein');
  addTerms(INITIAL_TERM_LISTS.Uncategorised, 'Uncategorised');

  // Seed sample Preferred Terms and "USE ALSO" relationships for demonstration
  const seedMappings: Record<string, { preferred?: string; useAlso?: string[] }> = {
    fasl: { preferred: 'FASLG', useAlso: ['CD95L', 'TNFSF6'] },
    pdcd1: { preferred: 'PDCD1', useAlso: ['CD279'] },
    cd274: { preferred: 'CD274', useAlso: ['PD-L1', 'B7-H1'] },
    her2: { preferred: 'ERBB2', useAlso: ['HER2/neu'] },
    'pd-1': { preferred: 'PD-1', useAlso: ['CD279'] },
    'humanized antibody': { useAlso: ['monoclonal antibody'] },
    'heavy chain variable region': { preferred: 'VH region', useAlso: ['heavy chain'] },
    'light chain variable region': { preferred: 'VL region', useAlso: ['light chain'] },
  };

  for (const [k, mapping] of Object.entries(seedMappings)) {
    if (map.has(k)) {
      const entry = map.get(k)!;
      if (mapping.preferred) entry.preferred = mapping.preferred;
      if (mapping.useAlso) entry.useAlso = mapping.useAlso;
    }
  }

  return map;
}
