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

    const prefKey = colKeys.find((c) => {
      const cl = c.toLowerCase().trim();
      return (
        cl.includes('preferred') ||
        cl === 'pref' ||
        cl === 'use' ||
        cl === 'use preferred' ||
        cl === 'prefer'
      );
    });

    const useAlsoKey = colKeys.find((c) => {
      const cl = c.toLowerCase().trim();
      return (
        cl.includes('use also') ||
        cl.includes('use_also') ||
        cl.includes('see also') ||
        cl.includes('see_also') ||
        cl.includes('usealso') ||
        cl.includes('also use') ||
        cl.includes('use too')
      );
    });

    const actKey = colKeys.find((c) => c.toLowerCase().includes('activity'));

    for (const row of rows) {
      const origTerm = String(row[termKey] ?? '').trim();
      if (!origTerm || origTerm.toLowerCase() === 'nan') continue;

      const prefTerm = prefKey ? String(row[prefKey] ?? '').trim() : '';
      const cleanPref = prefTerm.toLowerCase() === 'nan' ? '' : prefTerm;

      const useAlsoRaw = useAlsoKey ? String(row[useAlsoKey] ?? '').trim() : '';
      const cleanUseAlso: string[] =
        useAlsoRaw && useAlsoRaw.toLowerCase() !== 'nan'
          ? useAlsoRaw
              .split(/[,;\n|]+/)
              .map((t) => t.trim())
              .filter((t) => t.length > 0 && t.toLowerCase() !== 'nan')
          : [];

      const actTerm = actKey ? String(row[actKey] ?? '').trim() : '';
      const cleanAct = actTerm.toLowerCase() === 'nan' ? '' : actTerm;

      const origLower = origTerm.toLowerCase();

      if (!termMap.has(origLower)) {
        termMap.set(origLower, {
          original: origTerm,
          preferred: cleanPref,
          useAlso: cleanUseAlso.length > 0 ? cleanUseAlso : undefined,
          activity: cleanAct,
          categories: new Set([cat]),
        });
      } else {
        const item = termMap.get(origLower)!;
        if (cleanPref) item.preferred = cleanPref;
        if (cleanUseAlso.length > 0) {
          const existingUseAlso = new Set(item.useAlso || []);
          cleanUseAlso.forEach((u) => existingUseAlso.add(u));
          item.useAlso = Array.from(existingUseAlso);
        }
        if (cleanAct) item.activity = cleanAct;
        item.categories.add(cat);
      }

      if (cleanPref) {
        const prefLower = cleanPref.toLowerCase();
        if (!termMap.has(prefLower)) {
          termMap.set(prefLower, {
            original: cleanPref,
            preferred: '',
            useAlso: cleanUseAlso.length > 0 ? cleanUseAlso : undefined,
            activity: cleanAct,
            categories: new Set([cat]),
          });
        } else {
          termMap.get(prefLower)!.categories.add(cat);
          if (cleanUseAlso.length > 0) {
            const existingUseAlso = new Set(termMap.get(prefLower)!.useAlso || []);
            cleanUseAlso.forEach((u) => existingUseAlso.add(u));
            termMap.get(prefLower)!.useAlso = Array.from(existingUseAlso);
          }
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
 * - Preferred term: Replace original keyword with the Preferred term.
 * - Use Also: When a keyword has "Use Also" term(s), include those terms along with the selected/preferred term.
 * - Retain original with preferred: Only for Gene and Protein targets (Col 8). NOT for SSKW, Descriptors, Tech Focus, or Disease.
 * - Descriptors (Uncategorised) are linked to Technology Focus Keywords (Col 9), NOT Sequence Specific (Col 8).
 * - Custom keywords: If not present or not in an allowed category for the target column, prepend '@'.
 * - Disease: Append ` /{activity}` if activity exists and includeDiseaseActivity is true.
 */
export function resolveKeywords(
  keywords: string[],
  targetColumn: 'Disease' | 'Tech' | 'SS',
  termMap: Map<string, TermEntry>,
  keepOriginalGeneProtein: boolean = false,
  includeDiseaseActivity: boolean = true
): string[] {
  if (!keywords || keywords.length === 0) return [];

  const resolved: string[] = [];

  // Allowed categories per target column:
  // - Tech Focus (Col 9): includes Tech AND Descriptors (Uncategorised)
  // - Sequence Specific (Col 8): includes SS, Gene, Protein
  // - Disease (Col 7): includes Disease
  const allowedCategories: string[] =
    targetColumn === 'Disease'
      ? ['Disease']
      : targetColumn === 'Tech'
      ? ['Tech', 'Uncategorised']
      : ['SS', 'Gene', 'Protein'];

  for (const rawKw of keywords) {
    const kwClean = rawKw.trim();
    if (!kwClean) continue;

    const isForcedCustom = kwClean.startsWith('@');
    // Extract base word without @ and without activity /
    const kwLower = kwClean.replace(/^@+/, '').split('/')[0].trim().toLowerCase();

    // If term is not in termMap at all -> custom term, must have '@'
    if (!termMap.has(kwLower)) {
      let finalKw = kwClean;
      if (targetColumn === 'Disease' && !includeDiseaseActivity && finalKw.includes('/')) {
        finalKw = finalKw.split('/')[0].trim();
      }
      if (!isForcedCustom) {
        resolved.push('@' + finalKw);
      } else {
        resolved.push(finalKw);
      }
      continue;
    }

    const data = termMap.get(kwLower)!;
    const pref = data.preferred?.trim() || '';
    const act = data.activity?.trim() || '';
    const orig = data.original?.trim() || kwClean;
    const cats = data.categories;
    const useAlsoList = data.useAlso || [];

    // Check if the term officially belongs to an allowed category for this column
    const hasValidCategory = Array.from(cats).some((c) => allowedCategories.includes(c));
    const needsAt = !hasValidCategory || isForcedCustom;

    let primaryTerm = pref || orig;
    let originalTerm = orig;

    if (needsAt) {
      if (!primaryTerm.startsWith('@')) primaryTerm = '@' + primaryTerm;
      if (!originalTerm.startsWith('@')) originalTerm = '@' + originalTerm;
    }

    // Check if this term belongs to Gene or Protein category
    const isGeneOrProtein = cats.has('Gene') || cats.has('Protein');

    // Retain original with preferred rule:
    // Only for Gene & Protein in SS column when keepOriginalGeneProtein is true and preferred exists.
    const shouldRetainOriginal =
      targetColumn === 'SS' &&
      isGeneOrProtein &&
      Boolean(pref) &&
      Boolean(keepOriginalGeneProtein);

    if (targetColumn === 'Disease') {
      const cleanAct = act.replace(/^\/+/, '').trim();
      const actStr = includeDiseaseActivity && cleanAct ? ` /${cleanAct}` : '';
      resolved.push(`${primaryTerm}${actStr}`);
    } else {
      resolved.push(primaryTerm);
      if (shouldRetainOriginal && originalTerm.toLowerCase() !== primaryTerm.toLowerCase()) {
        resolved.push(originalTerm);
      }
    }

    // Process "USE ALSO" terms (include use also term along with selected)
    if (useAlsoList.length > 0) {
      for (const also of useAlsoList) {
        const alsoClean = also.trim();
        if (!alsoClean) continue;

        const alsoLower = alsoClean.replace(/^@+/, '').split('/')[0].trim().toLowerCase();
        let alsoResolved = alsoClean;

        if (termMap.has(alsoLower)) {
          const alsoData = termMap.get(alsoLower)!;
          const alsoPref = alsoData.preferred?.trim() || '';
          const alsoOrig = alsoData.original?.trim() || alsoClean;
          const alsoCats = alsoData.categories;
          const alsoValidCat = Array.from(alsoCats).some((c) => allowedCategories.includes(c));

          alsoResolved = alsoPref || alsoOrig;
          if (!alsoValidCat && !alsoResolved.startsWith('@')) {
            alsoResolved = '@' + alsoResolved;
          }

          if (targetColumn === 'Disease' && includeDiseaseActivity && alsoData.activity) {
            const alsoActClean = alsoData.activity.replace(/^\/+/, '').trim();
            if (alsoActClean && !alsoResolved.includes('/')) {
              alsoResolved = `${alsoResolved} /${alsoActClean}`;
            }
          }
        } else {
          // Custom use-also term not in dictionary
          if (!alsoClean.startsWith('@')) {
            alsoResolved = '@' + alsoClean;
          }
        }

        resolved.push(alsoResolved);
      }
    }
  }

  // Deduplicate preserving order
  return Array.from(new Set(resolved));
}
