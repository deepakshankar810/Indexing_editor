import React, { useState, useMemo } from 'react';
import {
  Download,
  Trash2,
  Plus,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { SequenceRow, CLARIVATE_COLUMNS } from '../types';

interface MasterGridTabProps {
  rows: SequenceRow[];
  setRows: React.Dispatch<React.SetStateAction<SequenceRow[]>>;
  onExportCSV: () => void;
  onClearGrid: () => void;
  onGoToBulkEditor: () => void;
}

export const MasterGridTab: React.FC<MasterGridTabProps> = ({
  rows,
  setRows,
  onExportCSV,
  onClearGrid,
  onGoToBulkEditor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyDeWarnings, setShowOnlyDeWarnings] = useState<boolean>(false);

  // Cell edit handler
  const handleCellChange = (rowIndex: number, columnKey: keyof SequenceRow, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = {
        ...next[rowIndex],
        [columnKey]: value,
      };
      return next;
    });
  };

  // Add row
  const handleAddRow = () => {
    const nextId = rows.length + 1;
    const newRow: SequenceRow = {
      id: nextId,
      sequence: `Seq ${nextId}`,
      sequenceStatus: 'Valid',
      sequenceType: '',
      moleculeType: '',
      sequenceLocationType: '',
      sequenceLocation: `SeqID ${nextId}`,
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
    };
    setRows((prev) => [...prev, newRow]);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (showOnlyDeWarnings && row.deLine.length <= 72) {
        return false;
      }

      if (filterType !== 'all') {
        if (row.sequenceType !== filterType && row.moleculeType !== filterType) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const matchesAny = CLARIVATE_COLUMNS.some((col) => {
          const val = String(row[col.key] ?? '').toLowerCase();
          return val.includes(search);
        });
        if (!matchesAny) return false;
      }

      return true;
    });
  }, [rows, searchTerm, filterType, showOnlyDeWarnings]);

  // Statistics
  const deWarningsCount = useMemo(() => {
    return rows.filter((r) => r.deLine && r.deLine.length > 72).length;
  }, [rows]);

  const p1Count = useMemo(() => rows.filter((r) => r.sequenceType === 'P1').length, [rows]);
  const dnaCount = useMemo(() => rows.filter((r) => r.sequenceType === 'N(DNA)').length, [rows]);
  const rnaCount = useMemo(() => rows.filter((r) => r.sequenceType === 'N(RNA)').length, [rows]);

  return (
    <div className="max-w-[1440px] mx-auto space-y-4">
      {/* Controls & Statistics Bar */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter sequences..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="P1">Protein (P1)</option>
              <option value="N(DNA)">DNA (N(DNA))</option>
              <option value="N(RNA)">RNA (N(RNA))</option>
            </select>
          </div>

          {deWarningsCount > 0 && (
            <button
              onClick={() => setShowOnlyDeWarnings((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                showOnlyDeWarnings
                  ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:border-amber-600 dark:text-amber-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300 dark:bg-slate-900 dark:text-amber-400 dark:border-slate-800 dark:hover:border-amber-700/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{deWarningsCount} over 72-char limit</span>
            </button>
          )}
        </div>

        {/* Metadata Stats */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span>
            Total: <strong className="text-slate-900 dark:text-white tabular-nums">{rows.length}</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">&middot;</span>
          <span>
            P1: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{p1Count}</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">&middot;</span>
          <span>
            DNA: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{dnaCount}</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">&middot;</span>
          <span>
            RNA: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{rnaCount}</strong>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
          <button
            onClick={onClearGrid}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 text-xs font-medium border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xs">
        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto relative">
          <table className="w-full border-collapse text-xs text-left">
            {/* Header */}
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-[#090d16] border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 uppercase tracking-wider text-[11px] font-medium">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-100 dark:bg-[#090d16] px-2.5 py-2.5 border-r border-slate-200 dark:border-slate-800 text-center w-10 font-mono text-[10px]">
                  #
                </th>
                {CLARIVATE_COLUMNS.map((col, idx) => (
                  <th
                    key={col.key}
                    className={`px-2.5 py-2.5 border-r border-slate-200 dark:border-slate-800/80 whitespace-nowrap ${
                      col.width ?? 'min-w-[150px]'
                    } ${idx === 0 ? 'sticky left-10 z-30 bg-slate-100 dark:bg-[#090d16] font-semibold text-slate-900 dark:text-slate-200' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      {col.key === 'deLine' && (
                        <span className="text-[10px] text-slate-500 font-mono lowercase">
                          (&le;72)
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={CLARIVATE_COLUMNS.length + 1}
                    className="py-16 text-center text-slate-500 font-sans"
                  >
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-700" />
                    <p className="font-medium text-slate-600 dark:text-slate-400 text-xs">No sequences match your filter</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-600 mt-0.5">
                      Adjust your filter query or add new sequences in Setup.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rIdx) => {
                  const deLength = row.deLine?.length || 0;
                  const isDeOver = deLength > 72;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-blue-50/50 dark:hover:bg-slate-850/60 transition-colors ${
                        isDeOver
                          ? 'bg-amber-50/80 dark:bg-amber-950/20'
                          : rIdx % 2 === 0
                          ? 'bg-white dark:bg-[#0e1422]'
                          : 'bg-slate-50/60 dark:bg-[#0b101b]'
                      }`}
                    >
                      {/* Row Index */}
                      <td className={`sticky left-0 z-10 px-2 py-1.5 border-r border-slate-200 dark:border-slate-800/80 text-center text-[10px] text-slate-500 tabular-nums ${
                        rIdx % 2 === 0 ? 'bg-white dark:bg-[#0e1422]' : 'bg-slate-50 dark:bg-[#0b101b]'
                      }`}>
                        {rIdx + 1}
                      </td>

                      {/* Columns */}
                      {CLARIVATE_COLUMNS.map((col, cIdx) => {
                        const cellVal = String(row[col.key] ?? '');
                        const isFirstCol = cIdx === 0;
                        const isDeCol = col.key === 'deLine';

                        return (
                          <td
                            key={col.key}
                            className={`p-0 border-r border-slate-200 dark:border-slate-800/60 align-middle ${
                              isFirstCol ? (rIdx % 2 === 0 ? 'sticky left-10 z-10 bg-white dark:bg-[#0e1422]' : 'sticky left-10 z-10 bg-slate-50 dark:bg-[#0b101b]') : ''
                            }`}
                          >
                            <div className="relative">
                              <input
                                type="text"
                                value={cellVal}
                                onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                                className={`w-full px-2.5 py-1.5 bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs transition-colors ${
                                  isFirstCol
                                    ? 'font-semibold text-blue-600 dark:text-cyan-400'
                                    : isDeCol && isDeOver
                                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                                    : 'text-slate-800 dark:text-slate-300'
                                }`}
                              />

                              {/* DE Line Character Count Indicator */}
                              {isDeCol && cellVal.length > 0 && (
                                <div
                                  className={`absolute right-1.5 top-1.5 text-[9px] tabular-nums font-mono px-1 rounded pointer-events-none ${
                                    isDeOver
                                      ? 'bg-amber-500 text-white font-bold'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {cellVal.length}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info inside spreadsheet */}
        <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#090d16] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-sans">
          <div>
            Showing <span className="text-slate-900 dark:text-white font-mono tabular-nums">{filteredRows.length}</span> of{' '}
            <span className="text-slate-900 dark:text-white font-mono tabular-nums">{rows.length}</span> sequences
          </div>
          <button
            onClick={onGoToBulkEditor}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>Configure bulk values in Bulk Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
