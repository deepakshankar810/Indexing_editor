export interface SequenceRow {
  id: number;
  sequence: string; // "Seq 1", "Seq 2", etc.
  sequenceStatus: string; // "Valid", etc.
  sequenceType: string; // "P1", "N(DNA)", "N(RNA)"
  moleculeType: string; // "protein", "peptide", "DNA", "RNA"
  sequenceLocationType: string; // "Claim 1", "Example 2", "Disclosure Y"
  sequenceLocation: string; // "SeqID 1", "Page 12", etc.
  diseaseKeywords: string;
  sequenceSpecificKeywords: string;
  technologyFocusKeywords: string;
  deLine: string; // max 72 characters
  comments: string;
  organismName: string; // "Homo sapiens$strain XYZ;Teschovirus A$;"
  organismType: string; // "Synthetic", "Chimeric", "Unidentified"
  internalCrossReferences: string;
  externalCrossReferences: string;
  featureKey: string;
  featureStart: string;
  featureStop: string;
  featureQualifier: string;
  featureLocation: string;
}

export const CLARIVATE_COLUMNS: { key: keyof SequenceRow; label: string; width?: string }[] = [
  { key: 'sequence', label: 'Sequence', width: 'w-24' },
  { key: 'sequenceStatus', label: 'Sequence Status', width: 'w-32' },
  { key: 'sequenceType', label: 'Sequence Type', width: 'w-32' },
  { key: 'moleculeType', label: 'Molecule Type', width: 'w-32' },
  { key: 'sequenceLocationType', label: 'Sequence Location Type', width: 'w-44' },
  { key: 'sequenceLocation', label: 'Sequence Location', width: 'w-36' },
  { key: 'diseaseKeywords', label: 'Disease Keywords', width: 'w-64' },
  { key: 'sequenceSpecificKeywords', label: 'Sequence Specific Keywords', width: 'w-64' },
  { key: 'technologyFocusKeywords', label: 'Technology Focus Keywords', width: 'w-64' },
  { key: 'deLine', label: 'DE Line (≤72 chars)', width: 'w-72' },
  { key: 'comments', label: 'Comments', width: 'w-80' },
  { key: 'organismName', label: 'Organism Name', width: 'w-60' },
  { key: 'organismType', label: 'Organism Type', width: 'w-36' },
  { key: 'internalCrossReferences', label: 'Internal Cross References', width: 'w-48' },
  { key: 'externalCrossReferences', label: 'External Cross References', width: 'w-48' },
  { key: 'featureKey', label: 'Feature Key', width: 'w-32' },
  { key: 'featureStart', label: 'Feature Start', width: 'w-28' },
  { key: 'featureStop', label: 'Feature Stop', width: 'w-28' },
  { key: 'featureQualifier', label: 'Feature Qualifier', width: 'w-36' },
  { key: 'featureLocation', label: 'Feature Location', width: 'w-36' },
];

export interface TermEntry {
  original: string;
  preferred: string;
  useAlso?: string[];
  activity: string;
  categories: Set<string>; // "Disease", "Tech", "SS", "Gene", "Protein", "Uncategorised"
}

export interface BulkEditState {
  targetRange: string;
  sequenceType: string;
  moleculeType: string;
  refLocType: 'Skip' | 'Claim' | 'Example' | 'Disclosure Y' | 'Features';
  refLocNum: string;
  physLocType: 'Skip' | 'Page' | 'Figure' | 'Column' | 'SEQ ID NO';
  physLocVal: string;
  organismListText: string;
  organismTypes: string[];
  diseaseKeywords: string[];
  includeDiseaseActivity: boolean;
  techKeywords: string[];
  ssKeywords: string[];
  geneKeywords: string[];
  proteinKeywords: string[];
  uncatKeywords: string[];
  keepOriginalSS: boolean;
  deBase: string;
  commentsBase: string;
}
