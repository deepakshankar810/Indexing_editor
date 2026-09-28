import { SequenceRow, CLARIVATE_COLUMNS, BulkEditState, TermEntry } from '../types';
import { resolveKeywords } from './thesaurusParser';

/**
 * Parses sequence ID range such as "all", "1-5", "1, 3, 5-8", "Seq 1 - Seq 5"
 */
export function parseSequenceIds(inputStr: string, totalRows: number): Set<number> | 'ALL' {
  if (!inputStr || inputStr.trim().toLowerCase() === 'all') {
    return 'ALL';
  }

  const ids = new Set<number>();
  const parts = inputStr.split(',');

  for (const part of parts) {
    const clean = part.replace(/seq\s*id\s*no:?/gi, '').replace(/seq\s*/gi, '').trim();
    if (!clean) continue;

    if (clean.includes('-')) {
      const [startStr, endStr] = clean.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let i = min; i <= max; i++) {
          if (i > 0 && i <= totalRows + 1000) ids.add(i);
        }
      }
    } else {
      const single = parseInt(clean, 10);
      if (!isNaN(single) && single > 0) {
        ids.add(single);
      }
    }
  }

  return ids;
}

/**
 * Creates initial empty Clarivate formatted rows
 */
export function createInitialRows(numSeqs: number = 10): SequenceRow[] {
  const count = Math.max(1, Math.min(numSeqs, 5000));
  const rows: SequenceRow[] = [];

  for (let i = 1; i <= count; i++) {
    rows.push({
      id: i,
      sequence: `Seq ${i}`,
      sequenceStatus: 'Valid',
      sequenceType: '',
      moleculeType: '',
      sequenceLocationType: '',
      sequenceLocation: `SeqID ${i}`,
      diseaseKeywords: '',
      sequenceSpecificKeywords: '',
      technologyFocusKeywords: '',
      deLine: '',
      comments: '',
      organismName: '',
      organismType: '',
      internalCrossReferences: '',
      externalCrossReferences: '',
      featureKey: '',
      featureStart: '',
      featureStop: '',
      featureQualifier: '',
      featureLocation: '',
    });
  }

  return rows;
}

/**
 * Formats multi-line organism input into Clarivate semicolon delimited string
 * Example:
 * Homo sapiens $ strain XYZ
 * Teschovirus A $
 * -> "Homo sapiens$strain XYZ;Teschovirus A$;"
 */
export function parseOrganismText(text: string): string {
  if (!text || !text.trim()) return '';

  const lines = text.trim().split('\n');
  const parts: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes('$')) {
      const [name, ...rest] = line.split('$');
      const comment = rest.join('$').trim();
      const cleanName = name.trim();
      if (cleanName) {
        parts.push(`${cleanName}$${comment}`);
      }
    } else {
      // User typed organism without $, append $ for Clarivate compliance
      parts.push(`${line}$`);
    }
  }

  return parts.join(';');
}

/**
 * Applies bulk edits to rows based on current state and Clarivate indexing rules
 */
export function applyBulkEditsToRows(
  currentRows: SequenceRow[],
  state: BulkEditState,
  termMap: Map<string, TermEntry>
): SequenceRow[] {
  const targetIds = parseSequenceIds(state.targetRange, currentRows.length);

  // Parse keywords with strict column checking
  const disResolved = resolveKeywords(
    state.diseaseKeywords,
    'Disease',
    termMap,
    false,
    state.includeDiseaseActivity ?? true
  );

  // Technology Focus (Column 9): includes Tech Focus Keywords AND Descriptors (Uncategorised)
  const combinedTech = [
    ...(state.techKeywords || []),
    ...(state.uncatKeywords || []),
  ];
  const techResolved = resolveKeywords(
    combinedTech,
    'Tech',
    termMap,
    false,
    false
  );

  // Sequence Specific (Column 8): includes SS Keywords, Gene Symbols, and Protein Targets (NO Descriptors)
  const combinedSS = [
    ...(state.ssKeywords || []),
    ...(state.geneKeywords || []),
    ...(state.proteinKeywords || []),
  ];
  const ssResolved = resolveKeywords(
    combinedSS,
    'SS',
    termMap,
    state.keepOriginalSS ?? true, // Only retains original for Gene & Protein targets
    false
  );

  const diseaseKwStr = disResolved.join(';');
  const techKwStr = techResolved.join(';');
  const ssKwStr = ssResolved.join(';');

  // Organisms
  const orgCombined = parseOrganismText(state.organismListText);
  const orgTypeStr = state.organismTypes.join('; ');

  // Sequence Location Type (Column 5 in Clarivate standard)
  let locTypeStr = '';
  if (state.refLocType === 'Claim' && state.refLocNum.trim()) {
    const num = state.refLocNum.trim().replace(/^claim\s*/i, '');
    locTypeStr = `Claim ${num}`;
  } else if (state.refLocType === 'Example' && state.refLocNum.trim()) {
    const num = state.refLocNum.trim().replace(/^example\s*/i, '').replace(/^ex\.?\s*/i, '');
    locTypeStr = `Example ${num}`;
  } else if (state.refLocType === 'Disclosure Y') {
    locTypeStr = 'Disclosure Y';
  } else if (state.refLocType === 'Features' && state.refLocNum.trim()) {
    const num = state.refLocNum.trim().replace(/^features?\s*/i, '');
    locTypeStr = `Features ${num}`;
  }

  // Physical Location (Column 6 in Clarivate standard)
  let physLocStr = '';
  if (state.physLocType === 'Page' && state.physLocVal.trim()) {
    const clean = state.physLocVal.trim().replace(/^page\s*/i, '');
    physLocStr = `Page ${clean}`;
  } else if (state.physLocType === 'Figure' && state.physLocVal.trim()) {
    const clean = state.physLocVal.trim().replace(/^figure\s*/i, '').replace(/^fig\.?\s*/i, '');
    physLocStr = `Figure ${clean}`;
  } else if (state.physLocType === 'Column' && state.physLocVal.trim()) {
    const clean = state.physLocVal.trim().replace(/^column\s*/i, '').replace(/^col\.?\s*/i, '');
    physLocStr = `Column ${clean}`;
  } else if (state.physLocType === 'SEQ ID NO' && state.physLocVal.trim()) {
    physLocStr = state.physLocVal.trim();
  }

  return currentRows.map((row, index) => {
    const seqNum = index + 1;

    // Check if included in target
    if (targetIds !== 'ALL' && !targetIds.has(seqNum)) {
      return row;
    }

    const updated = { ...row };

    if (state.sequenceType) updated.sequenceType = state.sequenceType;
    if (state.moleculeType) updated.moleculeType = state.moleculeType;
    if (locTypeStr) updated.sequenceLocationType = locTypeStr;
    if (orgCombined) updated.organismName = orgCombined;
    if (orgTypeStr) updated.organismType = orgTypeStr;

    if (physLocStr && state.physLocType !== 'Skip') {
      updated.sequenceLocation = physLocStr
        .replace(/\{x\}/gi, String(seqNum))
        .replace(/\{id\}/gi, String(seqNum));
    }

    if (diseaseKwStr) updated.diseaseKeywords = diseaseKwStr;
    if (techKwStr) updated.technologyFocusKeywords = techKwStr;

    if (ssKwStr) {
      if (updated.sequenceSpecificKeywords && updated.sequenceSpecificKeywords !== 'nan') {
        const existingKws = updated.sequenceSpecificKeywords.split(';').map((k) => k.trim());
        for (const kw of ssResolved) {
          if (!existingKws.includes(kw)) {
            existingKws.push(kw);
          }
        }
        updated.sequenceSpecificKeywords = existingKws.join(';');
      } else {
        updated.sequenceSpecificKeywords = ssKwStr;
      }
    }

    if (state.deBase.trim()) {
      updated.deLine = state.deBase
        .replace(/\{x\}/gi, String(seqNum))
        .replace(/\{id\}/gi, String(seqNum));
    }

    if (state.commentsBase.trim()) {
      updated.comments = state.commentsBase
        .replace(/\{x\}/gi, String(seqNum))
        .replace(/\{id\}/gi, String(seqNum));
    }

    return updated;
  });
}

/**
 * Converts SequenceRow[] to standard Clarivate CSV string
 */
export function exportToCSV(rows: SequenceRow[]): string {
  const headers = CLARIVATE_COLUMNS.map((c) => c.label);
  const csvLines: string[] = [headers.join(',')];

  for (const row of rows) {
    const line = CLARIVATE_COLUMNS.map((col) => {
      let val = String(row[col.key] ?? '');
      // Escape CSV double quotes
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes(';')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',');
    csvLines.push(line);
  }

  return csvLines.join('\r\n');
}

/**
 * Parses Clarivate formatted CSV back into SequenceRow[]
 */
export function parseClarivateCSV(csvText: string): SequenceRow[] {
  // Simple CSV parser handling quotes
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseCsvLine = (line: string): string[] => {
    const cells: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Map header index to column key
  const colIndexMap = new Map<number, keyof SequenceRow>();
  headerCells.forEach((h, idx) => {
    const matchedCol = CLARIVATE_COLUMNS.find((col) => {
      const label = col.label.toLowerCase();
      return (
        label === h ||
        label.replace(/\s+/g, '') === h.replace(/\s+/g, '') ||
        (h.includes('de line') && label.includes('de line')) ||
        (h.includes('tech') && label.includes('technology')) ||
        (h.includes('specific') && label.includes('specific')) ||
        (h.includes('location type') && label.includes('location type'))
      );
    });
    if (matchedCol) {
      colIndexMap.set(idx, matchedCol.key);
    }
  });

  const parsedRows: SequenceRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const rowObj: Partial<SequenceRow> = { id: i };

    cells.forEach((val, idx) => {
      const key = colIndexMap.get(idx);
      if (key && key !== 'id') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rowObj as any)[key] = val;
      }
    });

    // Defaults
    if (!rowObj.sequence) rowObj.sequence = `Seq ${i}`;
    if (!rowObj.sequenceStatus) rowObj.sequenceStatus = 'Valid';
    if (!rowObj.sequenceLocation) rowObj.sequenceLocation = `SeqID ${i}`;

    parsedRows.push(rowObj as SequenceRow);
  }

  return parsedRows;
}
