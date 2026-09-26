import * as XLSX from 'xlsx';
import { TermEntry } from '../types';

export interface ParsedThesaurusResult {
  termMap: Map<string, TermEntry>;
  dropdowns: {
    Disease: string[];
    Tech: string[];
    SS: string[];
    Gene: string[];
    Protein: string[];
    Uncategorised: string[];
  };
  totalTerms: number;
}

export async function parseThesaurusExcel(
  file: File,
  currentMap: Map<string, TermEntry>
): Promise<ParsedThesaurusResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // Clone map
  const termMap = new Map<string, TermEntry>();
  for (const [key, value] of currentMap.entries()) {
    termMap.set(key, {
      ...value,
      categories: new Set(value.categories),
    });
  }

  const dropdownSets = {
    Disease: new Set<string>(),
    Tech: new Set<string>(),
    SS: new Set<string>(),
    Gene: new Set<string>(),
    Protein: new Set<string>(),
    Uncategorised: new Set<string>(),
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert sheet to array of rows
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    if (!rows || rows.length === 0) continue;

    // Normalize column names
    const snLower = sheetName.toLowerCase();
    let cat: 'Disease' | 'Tech' | 'SS' | 'Gene' | 'Protein' | 'Uncategorised' = 'SS';
    if (snLower.includes('disease') || snLower.includes('activity')) cat = 'Disease';
    else if (snLower.includes('tech')) cat = 'Tech';
    else if (snLower.includes('gene')) cat = 'Gene';
    else if (snLower.includes('protein')) cat = 'Protein';
    else if (snLower.includes('uncat')) cat = 'Uncategorised';

    // Find columns
    const firstRow = rows[0];
    const colKeys = Object.keys(firstRow);

    const termKey = colKeys.find((c) => {
      const cl = c.toLowerCase();
      return cl.includes('term') || cl.includes('keyword') || cl.includes('name');
    }) || colKeys[0];

    const prefKey = colKeys.find((c) => c.toLowerCase().includes('preferred'));
    const actKey = colKeys.find((c) => c.toLowerCase().includes('activity'));

    for (const row of rows) {
      const origTerm = String(row[termKey] ?? '').trim();
      if (!origTerm || origTerm.toLowerCase() === 'nan') continue;

      const prefTerm = prefKey ? String(row[prefKey] ?? '').trim() : '';
      const cleanPref = prefTerm.toLowerCase() === 'nan' ? '' : prefTerm;

      const actTerm = actKey ? String(row[actKey] ?? '').trim() : '';
      const cleanAct = actTerm.toLowerCase() === 'nan' ? '' : actTerm;

      const origLower = origTerm.toLowerCase();

      if (!termMap.has(origLower)) {
        termMap.set(origLower, {
          original: origTerm,
          preferred: cleanPref,
          activity: cleanAct,
          categories: new Set([cat]),
        });
      } else {
        const item = termMap.get(origLower)!;
        if (cleanPref) item.preferred = cleanPref;
        if (cleanAct) item.activity = cleanAct;
        item.categories.add(cat);
      }

      if (cleanPref) {
        const prefLower = cleanPref.toLowerCase();
        if (!termMap.has(prefLower)) {
          termMap.set(prefLower, {
            original: cleanPref,
            preferred: '',
            activity: cleanAct,
            categories: new Set([cat]),
          });
        } else {
          termMap.get(prefLower)!.categories.add(cat);
        }
      }

      dropdownSets[cat].add(origTerm);
    }
  }

  return {
    termMap,
    dropdowns: {
      Disease: Array.from(dropdownSets.Disease).sort(),
      Tech: Array.from(dropdownSets.Tech).sort(),
      SS: Array.from(dropdownSets.SS).sort(),
      Gene: Array.from(dropdownSets.Gene).sort(),
      Protein: Array.from(dropdownSets.Protein).sort(),
      Uncategorised: Array.from(dropdownSets.Uncategorised).sort(),
    },
    totalTerms: termMap.size,
  };
}

/**
 * Resolves keywords based on Clarivate Geneseq rules:
 * - If user typed a custom keyword (or it's from another category than the target column allows), prepend '@'
 * - For Disease, append ` /{activity}` if activity exists
 * - For SS, if keep_original_ss is true and preferred term was used, keep both
 */
export function resolveKeywords(
  keywords: string[],
  targetColumn: 'Disease' | 'Tech' | 'SS',
  termMap: Map<string, TermEntry>,
  keepOriginalSS: boolean = false
): string[] {
  if (!keywords || keywords.length === 0) return [];

  const resolved: string[] = [];

  const allowedCategories: string[] =
    targetColumn === 'Disease'
      ? ['Disease']
      : targetColumn === 'Tech'
      ? ['Tech']
      : ['SS', 'Gene', 'Protein', 'Uncategorised'];

  for (const rawKw of keywords) {
    const kwClean = rawKw.trim();
    if (!kwClean) continue;

    const isForcedCustom = kwClean.startsWith('@');
    // Extract base word without @ and without activity /
    const kwLower = kwClean.replace(/^@+/, '').split('/')[0].trim().toLowerCase();

    // If term is not in termMap at all -> custom term, must have '@'
    if (!termMap.has(kwLower)) {
      if (!isForcedCustom) {
        resolved.push('@' + kwClean);
      } else {
        resolved.push(kwClean);
      }
      continue;
    }

    const data = termMap.get(kwLower)!;
    const pref = data.preferred;
    const act = data.activity;
    const orig = data.original;
    const cats = data.categories;

    // Check if the term officially belongs to an allowed category for this column
    const hasValidCategory = Array.from(cats).some((c) => allowedCategories.includes(c));
    const needsAt = !hasValidCategory || isForcedCustom;

    let primaryTerm = pref || orig;
    let originalTerm = orig;

    if (needsAt) {
      if (!primaryTerm.startsWith('@')) primaryTerm = '@' + primaryTerm;
      if (!originalTerm.startsWith('@')) originalTerm = '@' + originalTerm;
    }

    if (targetColumn === 'Disease') {
      const cleanAct = act.replace(/^\/+/, '').trim();
      const actStr = cleanAct ? ` /${cleanAct}` : '';
      resolved.push(`${primaryTerm}${actStr}`);
    } else {
      resolved.push(primaryTerm);
      if (targetColumn === 'SS' && pref && keepOriginalSS) {
        resolved.push(originalTerm);
      }
    }
  }

  // Deduplicate preserving order
  return Array.from(new Set(resolved));
}
