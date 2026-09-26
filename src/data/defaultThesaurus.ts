import { TermEntry } from '../types';

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
    'antibody',
    'humanized antibody',
    'monoclonal antibody',
    'heavy chain',
    'light chain',
    'gene fusion',
    'fusion protein',
    'chimeric protein',
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

  return map;
}
