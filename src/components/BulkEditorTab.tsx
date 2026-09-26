import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Check,
  AlertTriangle,
  ExternalLink,
  Plus,
  X,
  Sliders,
  FileText,
  Tag,
  Dna,
} from 'lucide-react';
import { BulkEditState, TermEntry } from '../types';
import { parseSequenceIds } from '../utils/sequenceProcessor';

interface BulkEditorTabProps {
  bulkState: BulkEditState;
  setBulkState: React.Dispatch<React.SetStateAction<BulkEditState>>;
  termMap: Map<string, TermEntry>;
  dropdownChoices: {
    Disease: string[];
    Tech: string[];
    SS: string[];
    Gene: string[];
    Protein: string[];
    Uncategorised: string[];
  };
  totalSequences: number;
  onApplyEdits: () => void;
  onClearEditor: () => void;
  onGoToGrid: () => void;
}

export const BulkEditorTab: React.FC<BulkEditorTabProps> = ({
  bulkState,
  setBulkState,
  termMap,
  dropdownChoices,
  totalSequences,
  onApplyEdits,
  onClearEditor,
  onGoToGrid,
}) => {
  const [customDisease, setCustomDisease] = useState('');
  const [customTech, setCustomTech] = useState('');

  // Target count calculation
  const targetIds = useMemo(() => {
    return parseSequenceIds(bulkState.targetRange, totalSequences);
  }, [bulkState.targetRange, totalSequences]);

  const targetCount = targetIds === 'ALL' ? totalSequences : targetIds.size;

  // DE Line Length calculation
  const deLength = bulkState.deBase.length;
  const isDeOverLimit = deLength > 72;
  const deRemaining = 72 - deLength;
  const dePercentage = Math.min(100, Math.round((deLength / 72) * 100));

  // Location preview calculations for Column 5 & 6
  const refLocPreview = useMemo(() => {
    if (bulkState.refLocType === 'Skip') return '(Unchanged)';
    if (bulkState.refLocType === 'Claim') {
      const num = bulkState.refLocNum.trim().replace(/^claim\s*/i, '');
      return num ? `Claim ${num}` : 'Claim [Number]';
    }
    if (bulkState.refLocType === 'Example') {
      const num = bulkState.refLocNum.trim().replace(/^example\s*/i, '').replace(/^ex\.?\s*/i, '');
      return num ? `Example ${num}` : 'Example [Number]';
    }
    if (bulkState.refLocType === 'Disclosure Y') return 'Disclosure Y';
    if (bulkState.refLocType === 'Features') {
      const num = bulkState.refLocNum.trim().replace(/^features?\s*/i, '');
      return num ? `Features ${num}` : 'Features [Number]';
    }
    return '';
  }, [bulkState.refLocType, bulkState.refLocNum]);

  const physLocPreview = useMemo(() => {
    if (bulkState.physLocType === 'Skip') return '(Unchanged)';
    if (bulkState.physLocType === 'Page') {
      const clean = bulkState.physLocVal.trim().replace(/^page\s*/i, '');
      return clean ? `Page ${clean}` : 'Page [Number]';
    }
    if (bulkState.physLocType === 'Figure') {
      const clean = bulkState.physLocVal.trim().replace(/^figure\s*/i, '').replace(/^fig\.?\s*/i, '');
      return clean ? `Figure ${clean}` : 'Figure [Number]';
    }
    if (bulkState.physLocType === 'Column') {
      const clean = bulkState.physLocVal.trim().replace(/^column\s*/i, '').replace(/^col\.?\s*/i, '');
      return clean ? `Column ${clean}` : 'Column [Number]';
    }
    if (bulkState.physLocType === 'SEQ ID NO') {
      return bulkState.physLocVal.trim()
        ? bulkState.physLocVal.trim().replace(/\{x\}|\{id\}/gi, '1')
        : 'SeqID 1';
    }
    return '';
  }, [bulkState.physLocType, bulkState.physLocVal]);

  const handleAddKeyword = (
    value: string,
    field: 'diseaseKeywords' | 'techKeywords' | 'ssKeywords' | 'geneKeywords' | 'proteinKeywords' | 'uncatKeywords'
  ) => {
    const clean = value.trim();
    if (!clean) return;

    if (!bulkState[field].includes(clean)) {
      setBulkState((prev) => ({
        ...prev,
        [field]: [...prev[field], clean],
      }));
    }
  };

  const handleRemoveKeyword = (
    kwToRemove: string,
    field: 'diseaseKeywords' | 'techKeywords' | 'ssKeywords' | 'geneKeywords' | 'proteinKeywords' | 'uncatKeywords'
  ) => {
    setBulkState((prev) => ({
      ...prev,
      [field]: prev[field].filter((k) => k !== kwToRemove),
    }));
  };

  return (
    <div className="max-w-[1240px] mx-auto space-y-5">
      {/* Target Range Selection Toolbar */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Target Sequence Range:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="text"
              value={bulkState.targetRange}
              onChange={(e) => setBulkState((prev) => ({ ...prev, targetRange: e.target.value }))}
              placeholder="all or 1-5, 10"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-1">
              {['all', '1-5', '6-10'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBulkState((prev) => ({ ...prev, targetRange: preset }))}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-800 font-mono transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Affects <span className="font-mono tabular-nums text-slate-900 dark:text-white font-semibold">{targetCount}</span> of{' '}
            <span className="font-mono tabular-nums text-slate-900 dark:text-white font-semibold">{totalSequences}</span> sequences
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearEditor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Form</span>
          </button>

          <button
            type="button"
            onClick={onApplyEdits}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Sequences</span>
          </button>
        </div>
      </div>

      {/* Structured Indexing Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Sequence Type, Location, Organisms */}
        <div className="space-y-5">
          {/* Card 1: Sequence & Molecule Type */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <Dna className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="font-medium text-slate-900 dark:text-white text-xs">
                Sequence &amp; Molecule Type
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Sequence Type
                </label>
                <select
                  value={bulkState.sequenceType}
                  onChange={(e) => setBulkState((prev) => ({ ...prev, sequenceType: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">(No change / Unspecified)</option>
                  <option value="P1">P1 (Protein)</option>
                  <option value="N(DNA)">N(DNA) (Deoxyribonucleic Acid)</option>
                  <option value="N(RNA)">N(RNA) (Ribonucleic Acid)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Molecule Type
                </label>
                <select
                  value={bulkState.moleculeType}
                  onChange={(e) => setBulkState((prev) => ({ ...prev, moleculeType: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">(No change / Unspecified)</option>
                  <option value="protein">protein</option>
                  <option value="peptide">peptide</option>
                  <option value="DNA">DNA</option>
                  <option value="RNA">RNA</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Sequence Locations (Clarivate Columns 5 & 6) */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs tracking-tight">
                  Patent Location Reference (Cols 5 &amp; 6)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Hierarchy: Claim &gt; Example &gt; Disclosure &gt; Features
              </span>
            </div>

            {/* Referred To Location Type (Column 5: Sequence Location Type) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Referred To Location <span className="text-slate-500 font-normal">(Column 5: Location Type)</span>
                </label>
                <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-medium">
                  {refLocPreview}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {(['Skip', 'Claim', 'Example', 'Disclosure Y', 'Features'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBulkState((prev) => ({ ...prev, refLocType: mode }))}
                    className={`py-1.5 px-1 rounded text-xs font-medium border text-center transition-colors ${
                      bulkState.refLocType === mode
                        ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200 dark:hover:bg-slate-850'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Dynamic Number input when Claim / Example / Features selected */}
              {(bulkState.refLocType === 'Claim' || bulkState.refLocType === 'Example' || bulkState.refLocType === 'Features') && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 focus-within:border-blue-500 overflow-hidden">
                    <span className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border-r border-slate-300 dark:border-slate-700/80 shrink-0">
                      {bulkState.refLocType}
                    </span>
                    <input
                      type="text"
                      value={bulkState.refLocNum}
                      onChange={(e) => setBulkState((prev) => ({ ...prev, refLocNum: e.target.value }))}
                      placeholder={
                        bulkState.refLocType === 'Claim'
                          ? 'e.g. 1 or 1-5'
                          : bulkState.refLocType === 'Example'
                          ? 'e.g. 2 or 2A'
                          : 'e.g. 1 or Table 3'
                      }
                      className="w-full px-2.5 py-1.5 bg-transparent text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {bulkState.refLocType === 'Claim'
                        ? 'Highest Geneseq priority. Enter claim numbers.'
                        : bulkState.refLocType === 'Example'
                        ? 'Used when sequence is disclosed in specific experimental examples.'
                        : 'Used when cited in patent feature descriptions or tables.'}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      Output: {refLocPreview}
                    </span>
                  </div>
                </div>
              )}

              {bulkState.refLocType === 'Disclosure Y' && (
                <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1.5 rounded">
                  Format for general patent specification: sets <code className="text-blue-600 dark:text-cyan-400 font-mono font-medium">Disclosure Y</code> in Column 5.
                </div>
              )}
            </div>

            {/* Physical Location (Column 6: Sequence Location) */}
            <div className="space-y-2 pt-2.5 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Physical Location <span className="text-slate-500 font-normal">(Column 6: Sequence Location)</span>
                </label>
                <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-medium">
                  {physLocPreview}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {(['Skip', 'Page', 'Figure', 'Column', 'SEQ ID NO'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBulkState((prev) => ({
                      ...prev,
                      physLocType: mode,
                      physLocVal: mode === 'SEQ ID NO' && !prev.physLocVal ? 'SeqID {x}' : prev.physLocVal,
                    }))}
                    className={`py-1.5 px-1 rounded text-xs font-medium border text-center transition-colors ${
                      bulkState.physLocType === mode
                        ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200 dark:hover:bg-slate-850'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {bulkState.physLocType !== 'Skip' && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 focus-within:border-blue-500 overflow-hidden">
                    {bulkState.physLocType !== 'SEQ ID NO' && (
                      <span className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border-r border-slate-300 dark:border-slate-700/80 shrink-0">
                        {bulkState.physLocType}
                      </span>
                    )}
                    <input
                      type="text"
                      value={bulkState.physLocVal}
                      onChange={(e) => setBulkState((prev) => ({ ...prev, physLocVal: e.target.value }))}
                      placeholder={
                        bulkState.physLocType === 'Page'
                          ? 'e.g. 12 or 15-18'
                          : bulkState.physLocType === 'Figure'
                          ? 'e.g. 2A or 3'
                          : bulkState.physLocType === 'Column'
                          ? 'e.g. 4 or 4-5'
                          : 'SeqID {x}'
                      }
                      className="w-full px-2.5 py-1.5 bg-transparent text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {bulkState.physLocType === 'SEQ ID NO'
                        ? 'Use token {x} to substitute the sequence ID automatically.'
                        : `Prefix "${bulkState.physLocType}" will be standardized automatically.`}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      Output: {physLocPreview}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Verification Box */}
            <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Clarivate Column Output Verification:
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-400 block text-[9px] uppercase">Col 5 (Location Type)</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{refLocPreview}</span>
                </div>
                <div className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-400 block text-[9px] uppercase">Col 6 (Sequence Location)</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{physLocPreview}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Organism Details */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <a
                  href="https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-xs inline-flex items-center gap-1.5"
                  title="Search NCBI Taxonomy Browser (opens in new tab)"
                >
                  <span>Organism Details</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Format: Name $ Comment</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Organisms List (One organism per line)
                </label>
                <textarea
                  rows={4}
                  value={bulkState.organismListText}
                  onChange={(e) => setBulkState((prev) => ({ ...prev, organismListText: e.target.value }))}
                  placeholder={`Homo sapiens $ strain XYZ\nTeschovirus A $\nEscherichia coli $ K-12`}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Auto-formatted with delimiter: <span className="font-mono text-slate-700 dark:text-slate-400">Homo sapiens$strain XYZ;Teschovirus A$;</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Organism Type Classifications
                </label>
                <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
                  {['Synthetic', 'Chimeric', 'Unidentified'].map((type) => {
                    const isChecked = bulkState.organismTypes.includes(type);
                    return (
                      <label key={type} className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkState((prev) => ({
                                ...prev,
                                organismTypes: [...prev.organismTypes, type],
                              }));
                            } else {
                              setBulkState((prev) => ({
                                ...prev,
                                organismTypes: prev.organismTypes.filter((t) => t !== type),
                              }));
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-0"
                        />
                        <span>{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Keywords, Live DE Counter, Comments */}
        <div className="space-y-5">
          {/* Card 4: Keywords Section */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="font-medium text-slate-900 dark:text-white text-xs">
                  Thesaurus Keywords Indexing
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">
                Custom terms auto-prefixed with '@'
              </span>
            </div>

            {/* Disease Keywords */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Disease / Activity Keywords
              </label>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddKeyword(e.target.value, 'diseaseKeywords');
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select from Thesaurus...</option>
                  {dropdownChoices.Disease.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customDisease}
                    onChange={(e) => setCustomDisease(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword(customDisease, 'diseaseKeywords');
                        setCustomDisease('');
                      }
                    }}
                    placeholder="custom term..."
                    className="w-32 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddKeyword(customDisease, 'diseaseKeywords');
                      setCustomDisease('');
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Disease Tags */}
              <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                {bulkState.diseaseKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-mono"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw, 'diseaseKeywords')}
                      className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tech Focus Keywords */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/60">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Technology Focus Keywords
              </label>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddKeyword(e.target.value, 'techKeywords');
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select from Thesaurus...</option>
                  {dropdownChoices.Tech.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customTech}
                    onChange={(e) => setCustomTech(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword(customTech, 'techKeywords');
                        setCustomTech('');
                      }
                    }}
                    placeholder="custom term..."
                    className="w-32 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleAddKeyword(customTech, 'techKeywords');
                      setCustomTech('');
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                {bulkState.techKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/80 text-cyan-800 dark:text-cyan-300 text-xs font-mono"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw, 'techKeywords')}
                      className="text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Sequence Specific Keywords */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Sequence Specific (SS, Gene, Protein, Uncat)
                </label>
                <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkState.keepOriginalSS}
                    onChange={(e) => setBulkState((prev) => ({ ...prev, keepOriginalSS: e.target.checked }))}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span>Retain original with Preferred</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddKeyword(e.target.value, 'ssKeywords');
                  }}
                  className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs"
                >
                  <option value="">Sequence Specific...</option>
                  {dropdownChoices.SS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddKeyword(e.target.value, 'geneKeywords');
                  }}
                  className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs"
                >
                  <option value="">Gene Targets...</option>
                  {dropdownChoices.Gene.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddKeyword(e.target.value, 'proteinKeywords');
                  }}
                  className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs"
                >
                  <option value="">Protein Targets...</option>
                  {dropdownChoices.Protein.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddKeyword(e.target.value, 'uncatKeywords');
                  }}
                  className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white text-xs"
                >
                  <option value="">Uncategorised...</option>
                  {dropdownChoices.Uncategorised.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              {/* Combined SS Tags */}
              <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                {[
                  ...bulkState.ssKeywords.map((k) => ({ text: k, field: 'ssKeywords' as const, color: 'blue' })),
                  ...bulkState.geneKeywords.map((k) => ({ text: k, field: 'geneKeywords' as const, color: 'amber' })),
                  ...bulkState.proteinKeywords.map((k) => ({ text: k, field: 'proteinKeywords' as const, color: 'purple' })),
                  ...bulkState.uncatKeywords.map((k) => ({ text: k, field: 'uncatKeywords' as const, color: 'slate' })),
                ].map(({ text, field, color }) => (
                  <span
                    key={text}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${
                      color === 'blue'
                        ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800/80'
                        : color === 'amber'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/80'
                        : color === 'purple'
                        ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800/80'
                        : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>{text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(text, field)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5: DE Line with Precision Character Counter */}
          <div
            className={`border rounded-xl p-4 space-y-3 transition-colors shadow-xs ${
              isDeOverLimit
                ? 'border-amber-500 bg-amber-50/50 dark:border-amber-600/80 dark:bg-amber-950/10'
                : 'bg-white dark:bg-[#0e1422] border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-white">
                  DE Line (Description Line)
                </label>
                <span className="text-[10px] text-slate-500">
                  Geneseq maximum rule: 72 characters
                </span>
              </div>

              {/* High-Precision Character Counter Display */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono tabular-nums font-semibold ${
                    isDeOverLimit
                      ? 'text-amber-600 dark:text-amber-400'
                      : deLength === 0
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {deLength} / 72
                </span>
                {isDeOverLimit && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    (+{Math.abs(deRemaining)} over)
                  </span>
                )}
              </div>
            </div>

            {/* Visual Linear Progress Gauge */}
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div
                className={`h-full transition-all duration-150 ${
                  isDeOverLimit
                    ? 'bg-amber-500'
                    : deLength > 60
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${dePercentage}%` }}
              />
            </div>

            <input
              type="text"
              value={bulkState.deBase}
              onChange={(e) => setBulkState((prev) => ({ ...prev, deBase: e.target.value }))}
              placeholder="e.g. Homo sapiens FASL gene, SEQ ID NO: {x}"
              className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-md text-slate-900 dark:text-white font-mono text-xs focus:outline-none ${
                isDeOverLimit
                  ? 'border-amber-500 focus:border-amber-400'
                  : 'border-slate-300 dark:border-slate-700/80 focus:border-blue-500'
              }`}
            />

            {/* Status Information */}
            <div className="text-[11px]">
              {isDeOverLimit ? (
                <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Exceeds maximum 72-character limit by {Math.abs(deRemaining)} character{Math.abs(deRemaining) > 1 ? 's' : ''}. Clarivate will reject lines over 72 characters.
                  </span>
                </div>
              ) : deLength > 0 ? (
                <div className="text-slate-600 dark:text-slate-400 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400">Within 72-char limit ({deRemaining} remaining)</span>
                  <span className="font-mono text-slate-500">
                    Preview: {bulkState.deBase.replace(/\{x\}/gi, '1')}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 text-[10px]">
                  Use token <code className="text-blue-600 dark:text-cyan-400 font-mono">{'{x}'}</code> to auto-substitute sequence number.
                </span>
              )}
            </div>
          </div>

          {/* Card 6: Comments */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-900 dark:text-white">
                Comments (Exact Text)
              </label>
              <button
                type="button"
                onClick={() => {
                  setBulkState((prev) => ({
                    ...prev,
                    commentsBase:
                      (prev.commentsBase ? prev.commentsBase + ' ' : '') +
                      'The present sequence is SEQ ID NO: {x} (see {seqid:{x}}).',
                  }));
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                + Insert {'{seqid:{x}}'} Tag
              </button>
            </div>

            <textarea
              rows={3}
              value={bulkState.commentsBase}
              onChange={(e) => setBulkState((prev) => ({ ...prev, commentsBase: e.target.value }))}
              placeholder="e.g. The present sequence is SEQ ID NO: {x} (see {seqid:{x}})..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Ready to write to <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{targetCount}</strong> sequences in Master Grid.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearEditor}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            Clear Form
          </button>
          <button
            type="button"
            onClick={onApplyEdits}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Sequences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
