import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Search,
  Activity,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { BulkEditState, TermEntry } from '../types';
import { parseSequenceIds } from '../utils/sequenceProcessor';
import { ALLOWED_TECH_IN_SSKW, normalizeTechSskwTerm } from '../data/defaultThesaurus';

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

interface KeywordFieldInputProps {
  label: string;
  field: 'diseaseKeywords' | 'techKeywords' | 'ssKeywords' | 'geneKeywords' | 'proteinKeywords' | 'uncatKeywords';
  badge: string;
  choices: string[];
  selectedKeywords: string[];
  onAddKeyword: (kw: string, field: 'diseaseKeywords' | 'techKeywords' | 'ssKeywords' | 'geneKeywords' | 'proteinKeywords' | 'uncatKeywords') => void;
  onRemoveKeyword: (kw: string, field: 'diseaseKeywords' | 'techKeywords' | 'ssKeywords' | 'geneKeywords' | 'proteinKeywords' | 'uncatKeywords') => void;
  termMap: Map<string, TermEntry>;
  placeholder: string;
  badgeBg: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
}

const KeywordFieldInput: React.FC<KeywordFieldInputProps> = ({
  label,
  field,
  badge,
  choices,
  selectedKeywords,
  onAddKeyword,
  onRemoveKeyword,
  termMap,
  placeholder,
  badgeBg,
  tagBg,
  tagBorder,
  tagText,
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return choices.slice(0, 15);
    return choices.filter((item) => item.toLowerCase().includes(q)).slice(0, 25);
  }, [search, choices]);

  return (
    <div className="space-y-2.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {label}
          </label>
          {selectedKeywords.length > 0 && (
            <button
              type="button"
              onClick={() => {
                for (const kw of [...selectedKeywords]) {
                  onRemoveKeyword(kw, field);
                }
              }}
              className="text-[11px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-medium cursor-pointer transition-colors"
              title={`Clear all ${label.toLowerCase()}`}
            >
              (Clear)
            </button>
          )}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono border ${badgeBg}`}>
          {badge}
        </span>
      </div>

      <div className="relative">
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (search.trim()) {
                    onAddKeyword(search.trim(), field);
                    setSearch('');
                    setIsOpen(false);
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder={placeholder}
              className="w-full h-10 pl-9 pr-8 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
            />
            {search && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearch('');
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch('');
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onAddKeyword(e.target.value, field);
            }}
            className="w-28 sm:w-32 h-10 px-3 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-blue-500 cursor-pointer shrink-0 transition-colors"
          >
            <option value="">Browse...</option>
            {choices.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {isOpen && (
          <div className="absolute z-30 left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
              <span>Matching {badge} Terms ({filteredSuggestions.length})</span>
              <span className="font-mono text-[9px] lowercase">press Enter or click</span>
            </div>

            {filteredSuggestions.map((item) => {
              const entry = termMap.get(item.toLowerCase());
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onAddKeyword(item, field);
                    setSearch('');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800/80 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{item}</span>
                      {entry?.preferred && entry.preferred.toLowerCase() !== item.toLowerCase() && (
                        <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-mono font-medium">
                          &rarr; {entry.preferred}
                        </span>
                      )}
                    </div>
                    {entry?.useAlso && entry.useAlso.length > 0 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate">
                        + Use Also: {entry.useAlso.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0">
                    <span>Add</span>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}

            {search.trim() && (
              <button
                type="button"
                onClick={() => {
                  onAddKeyword(search.trim(), field);
                  setSearch('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    Add Custom Term: <strong className="font-mono">@{search.trim().replace(/^@+/, '')}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Custom Tag</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[24px] pt-1">
        {selectedKeywords.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic">No {label.toLowerCase()} added.</span>
        ) : (
          selectedKeywords.map((kw) => (
            <span
              key={kw}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border shadow-2xs ${tagBg} ${tagBorder} ${tagText}`}
            >
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => onRemoveKeyword(kw, field)}
                className="hover:opacity-75 cursor-pointer ml-0.5"
                title="Remove keyword"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
};

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
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [isDiseaseOpen, setIsDiseaseOpen] = useState(false);
  const diseaseContainerRef = useRef<HTMLDivElement>(null);

  const [techSearch, setTechSearch] = useState('');
  const [isTechOpen, setIsTechOpen] = useState(false);
  const techContainerRef = useRef<HTMLDivElement>(null);

  // Active category tabs to maintain clean, spacious view
  const [activeTechTab, setActiveTechTab] = useState<'tech' | 'uncat' | 'all'>('tech');
  const [activeSsTab, setActiveSsTab] = useState<'ss' | 'gene' | 'protein' | 'all'>('ss');

  // Warning when an unallowed Tech Focus keyword is attempted in SSKW
  const [ssKwWarning, setSsKwWarning] = useState<string | null>(null);

  // Reset entire form and local search states
  const handleResetForm = () => {
    setDiseaseSearch('');
    setTechSearch('');
    setIsDiseaseOpen(false);
    setIsTechOpen(false);
    setSsKwWarning(null);
    onClearEditor();
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (diseaseContainerRef.current && !diseaseContainerRef.current.contains(event.target as Node)) {
        setIsDiseaseOpen(false);
      }
      if (techContainerRef.current && !techContainerRef.current.contains(event.target as Node)) {
        setIsTechOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Disease Suggestions
  const filteredDiseaseSuggestions = useMemo(() => {
    const query = diseaseSearch.trim().toLowerCase();
    if (!query) {
      // Top 15 default disease terms
      return dropdownChoices.Disease.slice(0, 15).map((item) => {
        const lower = item.split('/')[0].trim().toLowerCase();
        const entry = termMap.get(lower);
        return {
          original: entry?.original || item.split('/')[0].trim(),
          activity: entry?.activity || (item.includes('/') ? item.split('/')[1].trim() : ''),
        };
      });
    }

    const matches: { original: string; activity: string }[] = [];
    const seen = new Set<string>();

    for (const [key, entry] of termMap.entries()) {
      if (entry.categories.has('Disease')) {
        const matchTerm = entry.original.toLowerCase().includes(query);
        const matchPref = entry.preferred && entry.preferred.toLowerCase().includes(query);
        const matchAct = entry.activity && entry.activity.toLowerCase().includes(query);

        if (matchTerm || matchPref || matchAct) {
          const displayTerm = entry.preferred || entry.original;
          if (!seen.has(displayTerm.toLowerCase())) {
            seen.add(displayTerm.toLowerCase());
            matches.push({
              original: displayTerm,
              activity: entry.activity || '',
            });
          }
        }
      }
    }

    // Also check dropdownChoices
    for (const item of dropdownChoices.Disease) {
      if (item.toLowerCase().includes(query)) {
        const baseName = item.split('/')[0].trim();
        if (!seen.has(baseName.toLowerCase())) {
          seen.add(baseName.toLowerCase());
          const entry = termMap.get(baseName.toLowerCase());
          matches.push({
            original: baseName,
            activity: entry?.activity || (item.includes('/') ? item.split('/')[1].trim() : ''),
          });
        }
      }
    }

    return matches.slice(0, 25);
  }, [diseaseSearch, dropdownChoices.Disease, termMap]);

  // Filtered Tech Suggestions
  const filteredTechSuggestions = useMemo(() => {
    const query = techSearch.trim().toLowerCase();
    if (!query) return dropdownChoices.Tech.slice(0, 15);
    return dropdownChoices.Tech.filter((t) => t.toLowerCase().includes(query)).slice(0, 25);
  }, [techSearch, dropdownChoices.Tech]);

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

  // Total Sequence Specific count (Col 8: SS, Gene, Protein)
  const totalSsCount =
    bulkState.ssKeywords.length +
    bulkState.geneKeywords.length +
    bulkState.proteinKeywords.length;

  // Total Technology Focus count (Col 9: Tech Focus & Descriptors)
  const totalTechCount =
    bulkState.techKeywords.length +
    bulkState.uncatKeywords.length;

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
    let clean = value.trim();
    if (!clean) return;

    if (field === 'ssKeywords') {
      setSsKwWarning(null);
      // 1. Check if term matches one of the 14 allowed antibody/protein structural Tech Focus terms
      const allowedTech = normalizeTechSskwTerm(clean);
      if (allowedTech) {
        if (!clean.startsWith('@')) {
          clean = '@' + clean;
        }
      } else {
        // 2. Check if term is an unallowed Tech Focus keyword
        const lower = clean.replace(/^@+/, '').split('/')[0].trim().toLowerCase();
        if (termMap.has(lower)) {
          const cats = termMap.get(lower)!.categories;
          const isTechOnly =
            Array.from(cats).some((c) => c === 'Tech' || c === 'Uncategorised') &&
            !Array.from(cats).some((c) => c === 'SS' || c === 'Gene' || c === 'Protein');
          if (isTechOnly) {
            setSsKwWarning(
              `"${clean}" is a Technology Focus keyword (Col 9) and cannot be added to Sequence Specific Keywords (Col 8). Only specific antibody/structural terms (@antibody, @heavy chain, etc.) are allowed.`
            );
            return;
          }
        }
      }
    }

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
    <div className="max-w-[1380px] mx-auto space-y-6">
      {/* Target Range Selection Toolbar */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Input, presets, and affected count */}
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/40 shadow-2xs">
                <Sliders className="w-4 h-4" />
              </div>
              <span className="font-semibold text-xs">Target Sequences:</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={bulkState.targetRange}
                  onChange={(e) => setBulkState((prev) => ({ ...prev, targetRange: e.target.value }))}
                  placeholder="all or 1-5, 10"
                  className="w-36 px-3.5 py-2 pr-7 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
                />
                {bulkState.targetRange && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setBulkState((prev) => ({ ...prev, targetRange: '' }));
                    }}
                    onClick={() => setBulkState((prev) => ({ ...prev, targetRange: '' }))}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear target range"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Preset Range Chips */}
              <div className="flex items-center gap-1.5 shrink-0">
                {['all', '1-5', '6-10'].map((preset) => {
                  const isActive = bulkState.targetRange.trim().toLowerCase() === preset.toLowerCase();
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBulkState((prev) => ({ ...prev, targetRange: preset }))}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold dark:bg-blue-950/80 dark:text-cyan-300 dark:border-blue-700 shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scope Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 shrink-0">
              <span className={`w-2 h-2 rounded-full ${targetCount > 0 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-amber-500'}`} />
              <span>
                Affects <strong className="font-mono text-slate-900 dark:text-white font-bold">{targetCount}</strong> of{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300">{totalSequences}</span> rows
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>

            <button
              type="button"
              onClick={onApplyEdits}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Sequences</span>
            </button>
          </div>
        </div>
      </div>

      {/* Structured Indexing Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Sequence Type, Location, Organisms */}
        <div className="space-y-6">
          {/* Card 1: Sequence & Molecule Type */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Dna className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs tracking-tight">
                Sequence &amp; Molecule Type
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Sequence Type
                </label>
                <select
                  value={bulkState.sequenceType}
                  onChange={(e) => setBulkState((prev) => ({ ...prev, sequenceType: e.target.value }))}
                  className="w-full h-10 px-3 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/15 transition-all cursor-pointer"
                >
                  <option value="">(No change / Unspecified)</option>
                  <option value="P1">P1 (Protein)</option>
                  <option value="N(DNA)">N(DNA) (Deoxyribonucleic Acid)</option>
                  <option value="N(RNA)">N(RNA) (Ribonucleic Acid)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Molecule Type
                </label>
                <select
                  value={bulkState.moleculeType}
                  onChange={(e) => setBulkState((prev) => ({ ...prev, moleculeType: e.target.value }))}
                  className="w-full h-10 px-3 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/15 transition-all cursor-pointer"
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
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs tracking-tight">
                  Patent Location Reference (Cols 5 &amp; 6)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Claim &gt; Example &gt; Disclosure &gt; Features
              </span>
            </div>

            {/* Referred To Location Type (Column 5: Sequence Location Type) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Referred To Location <span className="text-slate-500 font-normal">(Col 5: Location Type)</span>
                </label>
                <span className="text-xs font-mono text-blue-600 dark:text-cyan-400 font-semibold">
                  {refLocPreview}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {(['Skip', 'Claim', 'Example', 'Disclosure Y', 'Features'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBulkState((prev) => ({ ...prev, refLocType: mode }))}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      bulkState.refLocType === mode
                        ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 shadow-2xs font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200 dark:hover:bg-slate-850'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Dynamic Number input when Claim / Example / Features selected */}
              {(bulkState.refLocType === 'Claim' || bulkState.refLocType === 'Example' || bulkState.refLocType === 'Features') && (
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 overflow-hidden transition-all">
                    <span className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border-r border-slate-300 dark:border-slate-700/80 shrink-0">
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
                      className="w-full px-3.5 py-2 bg-transparent text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {bulkState.refLocType === 'Claim'
                        ? 'Highest Geneseq priority. Enter claim numbers.'
                        : bulkState.refLocType === 'Example'
                        ? 'Disclosed in specific experimental examples.'
                        : 'Cited in patent feature descriptions or tables.'}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      Output: {refLocPreview}
                    </span>
                  </div>
                </div>
              )}

              {bulkState.refLocType === 'Disclosure Y' && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 px-3 py-2 rounded-xl">
                  Format for general patent specification: sets <code className="text-blue-600 dark:text-cyan-400 font-mono font-medium">Disclosure Y</code> in Column 5.
                </div>
              )}
            </div>

            {/* Physical Location (Column 6: Sequence Location) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Physical Location <span className="text-slate-500 font-normal">(Col 6: Sequence Location)</span>
                </label>
                <span className="text-xs font-mono text-blue-600 dark:text-cyan-400 font-semibold">
                  {physLocPreview}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {(['Skip', 'Page', 'Figure', 'Column', 'SEQ ID NO'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBulkState((prev) => ({
                      ...prev,
                      physLocType: mode,
                      physLocVal: mode === 'SEQ ID NO' && !prev.physLocVal ? 'SeqID {x}' : prev.physLocVal,
                    }))}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      bulkState.physLocType === mode
                        ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 shadow-2xs font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200 dark:hover:bg-slate-850'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {bulkState.physLocType !== 'Skip' && (
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 overflow-hidden transition-all">
                    {bulkState.physLocType !== 'SEQ ID NO' && (
                      <span className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border-r border-slate-300 dark:border-slate-700/80 shrink-0">
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
                      className="w-full px-3.5 py-2 bg-transparent text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {bulkState.physLocType === 'SEQ ID NO'
                        ? 'Token {x} auto-substitutes the sequence ID.'
                        : `Standardized prefix "${bulkState.physLocType}".`}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      Output: {physLocPreview}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Verification Box */}
            <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 text-xs space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Clarivate Column Output Preview:
              </div>
              <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                <div className="bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-400 block text-[9px] uppercase font-sans font-medium">Col 5 (Location Type)</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{refLocPreview}</span>
                </div>
                <div className="bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-400 block text-[9px] uppercase font-sans font-medium">Col 6 (Sequence Location)</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{physLocPreview}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Organism Details */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <a
                  href="https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 dark:text-cyan-400 hover:underline text-xs inline-flex items-center gap-1.5 tracking-tight"
                  title="Search NCBI Taxonomy Browser (opens in new tab)"
                >
                  <span>Organism Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Format: Name $ Comment</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Organisms List (One organism per line)
                </label>
                <textarea
                  rows={4}
                  value={bulkState.organismListText}
                  onChange={(e) => setBulkState((prev) => ({ ...prev, organismListText: e.target.value }))}
                  placeholder={`Homo sapiens $ strain XYZ\nTeschovirus A $\nEscherichia coli $ K-12`}
                  className="w-full p-3.5 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 leading-relaxed transition-all"
                />
                <div className="text-[11px] text-slate-500">
                  Auto-formatted with delimiter: <span className="font-mono text-slate-700 dark:text-slate-400">Homo sapiens$strain XYZ;Teschovirus A$;</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Organism Type Classifications
                </label>
                <div className="flex items-center gap-5 text-xs text-slate-700 dark:text-slate-300">
                  {['Synthetic', 'Chimeric', 'Unidentified'].map((type) => {
                    const isChecked = bulkState.organismTypes.includes(type);
                    return (
                      <label key={type} className="inline-flex items-center gap-2 cursor-pointer select-none">
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
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="font-medium">{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: DE Line (Description Line) */}
          <div
            className={`border rounded-2xl p-4 sm:p-5 space-y-3 transition-colors shadow-xs ${
              isDeOverLimit
                ? 'border-amber-500 bg-amber-50/40 dark:border-amber-600/80 dark:bg-amber-950/20'
                : 'bg-white dark:bg-[#0e1422] border-slate-200/90 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-900 dark:text-white">
                DE Line (Description Line)
              </label>

              {/* Character Counter Display */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md ${
                    isDeOverLimit
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold'
                      : deLength > 60
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {deLength} / 72
                </span>
                {isDeOverLimit && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    (+{Math.abs(deRemaining)} over)
                  </span>
                )}
              </div>
            </div>

            <input
              type="text"
              value={bulkState.deBase}
              onChange={(e) => setBulkState((prev) => ({ ...prev, deBase: e.target.value }))}
              placeholder="e.g. Homo sapiens FASL gene, SEQ ID NO: {x}"
              className={`w-full h-10 px-3.5 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-850 border rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 transition-all ${
                isDeOverLimit
                  ? 'border-amber-500 focus:ring-amber-500/20'
                  : 'border-slate-300 dark:border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/15'
              }`}
            />

            {/* Subtle Helper / Warning */}
            {isDeOverLimit ? (
              <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px] font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Exceeds max 72 chars. Clarivate will reject lines over 72 characters.</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Use <code className="text-blue-600 dark:text-cyan-400 font-mono font-medium">{'{x}'}</code> for sequence number</span>
                {deLength > 0 && (
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    Preview: {bulkState.deBase.replace(/\{x\}/gi, '1')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Card 5: Sequence Comments */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-900 dark:text-white">
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
                className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-medium cursor-pointer"
              >
                + Insert {'{seqid:{x}}'} Tag
              </button>
            </div>

            <textarea
              rows={3}
              value={bulkState.commentsBase}
              onChange={(e) => setBulkState((prev) => ({ ...prev, commentsBase: e.target.value }))}
              placeholder="e.g. The present sequence is SEQ ID NO: {x} (see {seqid:{x}})..."
              className="w-full p-3.5 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 leading-relaxed transition-all"
            />
          </div>
        </div>

        {/* Right Column: Keywords */}
        <div className="space-y-6">
          {/* Card: Keywords Section */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs tracking-tight">
                  Thesaurus Keywords Indexing
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">
                Custom terms auto-prefixed with '@'
              </span>
            </div>

            {/* Disease Keywords */}
            <div className="space-y-2.5" ref={diseaseContainerRef}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Disease Keywords (Col 7)
                  </label>
                  {bulkState.diseaseKeywords.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBulkState((prev) => ({ ...prev, diseaseKeywords: [] }))}
                      className="text-[11px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-medium cursor-pointer transition-colors"
                      title="Clear all disease keywords"
                    >
                      (Clear)
                    </button>
                  )}
                </div>

                {/* Activity ON / OFF Toggle & Checkbox */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBulkState((prev) => ({
                        ...prev,
                        includeDiseaseActivity: !prev.includeDiseaseActivity,
                      }))
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      bulkState.includeDiseaseActivity
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                    }`}
                    title="Click to toggle whether therapeutic activity terms (/cytostatic, /antidiabetic, etc.) are included with disease keywords"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        bulkState.includeDiseaseActivity
                          ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>Activity: {bulkState.includeDiseaseActivity ? 'ON (/act included)' : 'OFF (disease only)'}</span>
                  </button>

                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bulkState.includeDiseaseActivity}
                      onChange={(e) =>
                        setBulkState((prev) => ({
                          ...prev,
                          includeDiseaseActivity: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Include /activity</span>
                  </label>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {bulkState.includeDiseaseActivity ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓ <strong>Activity Enabled:</strong> Diseases will automatically attach their registered activity (e.g.{' '}
                    <em>cancer /cytostatic</em>, <em>diabetes /antidiabetic</em>, <em>pain /analgesic</em>).
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    ○ <strong>Disease Only Mode:</strong> Terms will be saved without therapeutic activity (e.g.{' '}
                    <em>cancer</em>, <em>diabetes</em>, <em>pain</em>).
                  </span>
                )}
              </div>

              {/* Searchable Disease Input Combobox */}
              <div className="relative">
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={diseaseSearch}
                      onChange={(e) => {
                        setDiseaseSearch(e.target.value);
                        setIsDiseaseOpen(true);
                      }}
                      onFocus={() => setIsDiseaseOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (diseaseSearch.trim()) {
                            if (filteredDiseaseSuggestions.length > 0 && filteredDiseaseSuggestions[0].original.toLowerCase() === diseaseSearch.trim().toLowerCase()) {
                              const item = filteredDiseaseSuggestions[0];
                              const toAdd = bulkState.includeDiseaseActivity && item.activity
                                ? `${item.original} /${item.activity}`
                                : item.original;
                              handleAddKeyword(toAdd, 'diseaseKeywords');
                            } else {
                              handleAddKeyword(diseaseSearch.trim(), 'diseaseKeywords');
                            }
                            setDiseaseSearch('');
                            setIsDiseaseOpen(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsDiseaseOpen(false);
                        }
                      }}
                      placeholder="Type to search disease terms or enter custom..."
                      className="w-full h-10 pl-9 pr-8 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
                    />
                    {diseaseSearch && (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDiseaseSearch('');
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDiseaseSearch('');
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Standard select as alternative browse */}
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const base = e.target.value.split('/')[0].trim();
                        const entry = termMap.get(base.toLowerCase());
                        const act = entry?.activity || (e.target.value.includes('/') ? e.target.value.split('/')[1].trim() : '');
                        const toAdd = bulkState.includeDiseaseActivity && act
                          ? `${base} /${act}`
                          : base;
                        handleAddKeyword(toAdd, 'diseaseKeywords');
                      }
                    }}
                    className="w-32 sm:w-36 h-10 px-3 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-blue-500 cursor-pointer shrink-0 transition-colors"
                  >
                    <option value="">Browse List...</option>
                    {dropdownChoices.Disease.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Suggestions Dropdown Popover */}
                {isDiseaseOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
                      <span>Matching Controlled Disease Terms ({filteredDiseaseSuggestions.length})</span>
                      <span className="font-mono text-[9px] lowercase">press Enter or click to add</span>
                    </div>

                    {filteredDiseaseSuggestions.map((item) => {
                      const displayTerm = item.original;
                      const hasAct = !!item.activity;
                      const willOutput = bulkState.includeDiseaseActivity && hasAct
                        ? `${displayTerm} /${item.activity}`
                        : displayTerm;

                      return (
                        <button
                          key={displayTerm}
                          type="button"
                          onClick={() => {
                            handleAddKeyword(willOutput, 'diseaseKeywords');
                            setDiseaseSearch('');
                            setIsDiseaseOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800/80 flex items-center justify-between group transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {displayTerm}
                            </span>
                            {hasAct && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  bulkState.includeDiseaseActivity
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/80'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 line-through opacity-70'
                                }`}
                                title={
                                  bulkState.includeDiseaseActivity
                                    ? `Activity attached: /${item.activity}`
                                    : `Activity omitted because Activity toggle is OFF`
                                }
                              >
                                /{item.activity}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            <span className="font-mono">Add &rarr; {willOutput}</span>
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom Term Fallback Option */}
                    {diseaseSearch.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          handleAddKeyword(diseaseSearch.trim(), 'diseaseKeywords');
                          setDiseaseSearch('');
                          setIsDiseaseOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>
                            Add Custom Term: <strong className="font-mono">@{diseaseSearch.trim().replace(/^@+/, '')}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Custom Tag</span>
                      </button>
                    )}

                    {filteredDiseaseSuggestions.length === 0 && !diseaseSearch.trim() && (
                      <div className="px-3 py-3 text-center text-slate-400 text-xs">
                        Type keywords to search Clarivate thesaurus...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Disease Tags */}
              <div className="flex flex-wrap gap-1.5 min-h-[24px] pt-1">
                {bulkState.diseaseKeywords.length === 0 ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">No disease keywords selected.</span>
                ) : (
                  bulkState.diseaseKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-mono shadow-2xs"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw, 'diseaseKeywords')}
                        className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200 cursor-pointer ml-0.5"
                        title="Remove keyword"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Technology Focus & Descriptors (Col 9) */}
            <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Technology Focus &amp; Descriptors (Col 9)
                  </label>
                  {totalTechCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-semibold border border-cyan-200 dark:border-cyan-800">
                      {totalTechCount} selected
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Linked into Clarivate Column 9
                </span>
              </div>

              {/* Sub-Category Segmented Tab Selector for Col 9 */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTechTab('tech')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTechTab === 'tech'
                      ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Tech Focus Terms</span>
                  {bulkState.techKeywords.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-mono font-bold">
                      {bulkState.techKeywords.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTechTab('uncat')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTechTab === 'uncat'
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span>General Descriptors</span>
                  {bulkState.uncatKeywords.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold">
                      {bulkState.uncatKeywords.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTechTab('all')}
                  className={`ml-auto px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                    activeTechTab === 'all'
                      ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  title="View both Tech Focus and Descriptors inputs simultaneously"
                >
                  Show Both
                </button>
              </div>

              {/* Tabbed Content for Col 9 */}
              <div className="space-y-4 pt-1">
                {(activeTechTab === 'tech' || activeTechTab === 'all') && (
                  <KeywordFieldInput
                    label="Technology Focus Keywords"
                    field="techKeywords"
                    badge="Tech"
                    choices={dropdownChoices.Tech}
                    selectedKeywords={bulkState.techKeywords}
                    onAddKeyword={handleAddKeyword}
                    onRemoveKeyword={handleRemoveKeyword}
                    termMap={termMap}
                    placeholder="Type to search tech keywords (e.g. CRISPR, antibody, cell culture)..."
                    badgeBg="bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/80"
                    tagBg="bg-cyan-50 dark:bg-cyan-950/80"
                    tagBorder="border-cyan-200 dark:border-cyan-800/80"
                    tagText="text-cyan-800 dark:text-cyan-300"
                  />
                )}

                {(activeTechTab === 'uncat' || activeTechTab === 'all') && (
                  <KeywordFieldInput
                    label="General Descriptors"
                    field="uncatKeywords"
                    badge="Descriptor"
                    choices={dropdownChoices.Uncategorised}
                    selectedKeywords={bulkState.uncatKeywords}
                    onAddKeyword={handleAddKeyword}
                    onRemoveKeyword={handleRemoveKeyword}
                    termMap={termMap}
                    placeholder="Type to search descriptors (e.g. synthetic construct, mutant, variant)..."
                    badgeBg="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    tagBg="bg-slate-100 dark:bg-slate-800"
                    tagBorder="border-slate-200 dark:border-slate-700"
                    tagText="text-slate-800 dark:text-slate-300"
                  />
                )}
              </div>

              {/* Combined Tech Keywords Summary Tray (when not showing both) */}
              {activeTechTab !== 'all' && totalTechCount > 0 && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>All Active Technology Focus &amp; Descriptors ({totalTechCount})</span>
                    <span className="text-[10px] font-mono">Combined into Col 9</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {[
                      ...bulkState.techKeywords.map((k) => ({ text: k, field: 'techKeywords' as const, color: 'cyan', label: 'Tech' })),
                      ...bulkState.uncatKeywords.map((k) => ({ text: k, field: 'uncatKeywords' as const, color: 'slate', label: 'Descriptor' })),
                    ].map(({ text, field, color, label }) => (
                      <span
                        key={`${field}-${text}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border shadow-2xs ${
                          color === 'cyan'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800/80'
                            : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <span className="opacity-60 text-[10px] uppercase font-bold">{label}:</span>
                        <span>{text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(text, field)}
                          className="hover:opacity-75 cursor-pointer ml-0.5"
                          title="Remove keyword"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sequence Specific Keywords (Col 8: SS, Gene, Protein) */}
            <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <Dna className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Sequence Specific Fields (Col 8)
                  </label>
                  {totalSsCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                      {totalSsCount} selected
                    </span>
                  )}
                </div>
                <label
                  className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                  title="Retains original symbol with preferred synonym for Gene Symbols and Protein Targets only"
                >
                  <input
                    type="checkbox"
                    checked={bulkState.keepOriginalSS}
                    onChange={(e) => setBulkState((prev) => ({ ...prev, keepOriginalSS: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-medium">Retain original for Gene &amp; Protein</span>
                </label>
              </div>

              {/* Alert Warning if an unallowed Tech Focus keyword was attempted in SSKW */}
              {ssKwWarning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-800 dark:text-amber-300 text-xs animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{ssKwWarning}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSsKwWarning(null)}
                    className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Explanatory Rule Hint for Analysts */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 leading-relaxed">
                <span>
                  <strong>Clarivate Rule:</strong> SSKW, Descriptors, Tech Focus, and Disease always use the <em>Preferred Term</em> only. Gene Symbols and Protein Targets can retain both the preferred term and the original symbol in Column 8 when enabled.
                </span>
              </div>

              {/* Quick-Add Allowed Antibody / Structural SSKW Terms */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-200">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Allowed Tech Focus Antibody &amp; Structural Terms in SSKW (@terms):</span>
                  </div>
                  <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-mono font-medium">
                    Auto-adds '@' in Col 8
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Only these specific antibody and structural terms may be used in SSKW (with an <strong className="font-mono text-blue-600 dark:text-cyan-400">@</strong> prefix). Other Tech Focus keywords are strictly restricted to Col 9.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ALLOWED_TECH_IN_SSKW.map((term) => {
                    const atTerm = '@' + term;
                    const isSelected = bulkState.ssKeywords.includes(atTerm) || bulkState.ssKeywords.includes(term);
                    return (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveKeyword(atTerm, 'ssKeywords');
                            handleRemoveKeyword(term, 'ssKeywords');
                          } else {
                            handleAddKeyword(atTerm, 'ssKeywords');
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                            : 'bg-white hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                        title={isSelected ? `Click to remove ${atTerm}` : `Click to add ${atTerm} to SSKW`}
                      >
                        <span>{atTerm}</span>
                        {isSelected ? <Check className="w-3 h-3 ml-0.5" /> : <Plus className="w-3 h-3 ml-0.5 text-slate-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Category Segmented Tab Selector for Col 8 */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setActiveSsTab('ss')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSsTab === 'ss'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span>SS Terms</span>
                  {bulkState.ssKeywords.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-bold">
                      {bulkState.ssKeywords.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSsTab('gene')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSsTab === 'gene'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Gene Symbols</span>
                  {bulkState.geneKeywords.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold">
                      {bulkState.geneKeywords.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSsTab('protein')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSsTab === 'protein'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Protein Targets</span>
                  {bulkState.proteinKeywords.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono font-bold">
                      {bulkState.proteinKeywords.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSsTab('all')}
                  className={`ml-auto px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                    activeSsTab === 'all'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  title="View all 3 Sequence Specific inputs simultaneously"
                >
                  Show All 3
                </button>
              </div>

              {/* Tabbed Content for Col 8 */}
              <div className="space-y-4 pt-1">
                {(activeSsTab === 'ss' || activeSsTab === 'all') && (
                  <KeywordFieldInput
                    label="Sequence Specific Keywords"
                    field="ssKeywords"
                    badge="SS"
                    choices={dropdownChoices.SS}
                    selectedKeywords={bulkState.ssKeywords}
                    onAddKeyword={handleAddKeyword}
                    onRemoveKeyword={handleRemoveKeyword}
                    termMap={termMap}
                    placeholder="Type to search SS terms (e.g. PCR, siRNA, ds, ss)..."
                    badgeBg="bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/80"
                    tagBg="bg-blue-50 dark:bg-blue-950/80"
                    tagBorder="border-blue-200 dark:border-blue-800/80"
                    tagText="text-blue-800 dark:text-blue-300"
                  />
                )}

                {(activeSsTab === 'gene' || activeSsTab === 'all') && (
                  <KeywordFieldInput
                    label="Gene Symbols"
                    field="geneKeywords"
                    badge="Gene"
                    choices={dropdownChoices.Gene}
                    selectedKeywords={bulkState.geneKeywords}
                    onAddKeyword={handleAddKeyword}
                    onRemoveKeyword={handleRemoveKeyword}
                    termMap={termMap}
                    placeholder="Type to search gene symbols (e.g. BRCA1, EGFR, TP53, FASL)..."
                    badgeBg="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/80"
                    tagBg="bg-amber-50 dark:bg-amber-950/80"
                    tagBorder="border-amber-200 dark:border-amber-800/80"
                    tagText="text-amber-800 dark:text-amber-300"
                  />
                )}

                {(activeSsTab === 'protein' || activeSsTab === 'all') && (
                  <KeywordFieldInput
                    label="Protein Targets"
                    field="proteinKeywords"
                    badge="Protein"
                    choices={dropdownChoices.Protein}
                    selectedKeywords={bulkState.proteinKeywords}
                    onAddKeyword={handleAddKeyword}
                    onRemoveKeyword={handleRemoveKeyword}
                    termMap={termMap}
                    placeholder="Type to search protein targets (e.g. insulin, CD4, TNF, interferon)..."
                    badgeBg="bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/80"
                    tagBg="bg-purple-50 dark:bg-purple-950/80"
                    tagBorder="border-purple-200 dark:border-purple-800/80"
                    tagText="text-purple-800 dark:text-purple-300"
                  />
                )}
              </div>

              {/* Combined Keywords Summary Tray for Col 8 */}
              {activeSsTab !== 'all' && totalSsCount > 0 && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>All Active Sequence Specific Keywords ({totalSsCount})</span>
                    <span className="text-[10px] font-mono">Combined into Col 8</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {[
                      ...bulkState.ssKeywords.map((k) => ({ text: k, field: 'ssKeywords' as const, color: 'blue', label: 'SS' })),
                      ...bulkState.geneKeywords.map((k) => ({ text: k, field: 'geneKeywords' as const, color: 'amber', label: 'Gene' })),
                      ...bulkState.proteinKeywords.map((k) => ({ text: k, field: 'proteinKeywords' as const, color: 'purple', label: 'Protein' })),
                    ].map(({ text, field, color, label }) => (
                      <span
                        key={`${field}-${text}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border shadow-2xs ${
                          color === 'blue'
                            ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800/80'
                            : color === 'amber'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/80'
                            : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800/80'
                        }`}
                      >
                        <span className="opacity-60 text-[10px] uppercase font-bold">{label}:</span>
                        <span>{text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(text, field)}
                          className="hover:opacity-75 cursor-pointer ml-0.5"
                          title="Remove keyword"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span>
            Ready to write to <strong className="text-slate-900 dark:text-white font-mono tabular-nums font-bold">{targetCount}</strong> sequences in Master Grid.
          </span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleResetForm}
            className="h-10 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer"
          >
            Clear Form
          </button>
          <button
            type="button"
            onClick={onApplyEdits}
            className="h-10 inline-flex items-center gap-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Sequences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
