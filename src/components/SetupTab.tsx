import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { parseThesaurusExcel } from '../utils/thesaurusParser';
import { TermEntry } from '../types';
import { createDefaultTermMap } from '../data/defaultThesaurus';

interface SetupTabProps {
  termMap: Map<string, TermEntry>;
  setTermMap: React.Dispatch<React.SetStateAction<Map<string, TermEntry>>>;
  numSequences: number;
  setNumSequences: (num: number) => void;
  onInitializeGrid: (num: number) => void;
  onImportCSV: (file: File) => void;
  onContinueToEditor: () => void;
  totalSequences?: number;
  onGoToGrid?: () => void;
}

export const SetupTab: React.FC<SetupTabProps> = ({
  termMap,
  setTermMap,
  numSequences,
  setNumSequences,
  onInitializeGrid,
  onImportCSV,
  onContinueToEditor,
  totalSequences = 0,
  onGoToGrid,
}) => {
  const [loadingThesaurus, setLoadingThesaurus] = useState(false);
  const [thesaurusFileName, setThesaurusFileName] = useState<string | null>(null);
  const [showTermBrowser, setShowTermBrowser] = useState(false);
  const [termSearch, setTermSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'All' | 'Disease' | 'Tech' | 'SS' | 'Gene' | 'Protein' | 'Uncategorised'
  >('All');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  const filteredTermsList = useMemo(() => {
    const list: [string, TermEntry][] = [];
    const searchLower = termSearch.trim().toLowerCase();
    for (const [key, entry] of termMap.entries()) {
      if (selectedCategoryFilter !== 'All' && !entry.categories.has(selectedCategoryFilter)) {
        continue;
      }
      if (searchLower) {
        const matchesOriginal = entry.original.toLowerCase().includes(searchLower);
        const matchesPref = entry.preferred?.toLowerCase().includes(searchLower);
        const matchesAct = entry.activity?.toLowerCase().includes(searchLower);
        if (!matchesOriginal && !matchesPref && !matchesAct) continue;
      }
      list.push([key, entry]);
    }
    return list.sort((a, b) => a[1].original.localeCompare(b[1].original));
  }, [termMap, termSearch, selectedCategoryFilter]);

  const thesaurusCounts = useMemo(() => {
    let diseaseCount = 0;
    let techCount = 0;
    let ssCount = 0;
    let geneCount = 0;
    let proteinCount = 0;
    let uncatCount = 0;
    let preferredMappingCount = 0;
    let activityMappingCount = 0;

    for (const entry of termMap.values()) {
      if (entry.categories.has('Disease')) diseaseCount++;
      if (entry.categories.has('Tech')) techCount++;
      if (entry.categories.has('SS')) ssCount++;
      if (entry.categories.has('Gene')) geneCount++;
      if (entry.categories.has('Protein')) proteinCount++;
      if (entry.categories.has('Uncategorised')) uncatCount++;
      if (entry.preferred && entry.preferred.trim().length > 0) preferredMappingCount++;
      if (entry.activity && entry.activity.trim().length > 0) activityMappingCount++;
    }

    return {
      totalLoaded: termMap.size,
      diseaseCount,
      techCount,
      ssCount,
      geneCount,
      proteinCount,
      uncatCount,
      preferredMappingCount,
      activityMappingCount,
    };
  }, [termMap]);

  const handleThesaurusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLoadingThesaurus(true);
      try {
        const result = await parseThesaurusExcel(file, termMap);
        setTermMap(result.termMap);
        setThesaurusFileName(file.name);
      } catch (err) {
        console.error('Failed to parse thesaurus:', err);
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xlsm file.');
      } finally {
        setLoadingThesaurus(false);
      }
    }
  };

  const handleResetThesaurus = () => {
    setTermMap(createDefaultTermMap());
    setThesaurusFileName(null);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Workbench Context Header */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              Workspace Configuration
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Initialize your patent sequence project by verifying the controlled vocabulary thesaurus dictionary or importing an existing Clarivate Geneseq sequence export file.
            </p>
          </div>
          <button
            onClick={onContinueToEditor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <span>Proceed to Bulk Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Controlled Thesaurus Matrix */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-blue-600 dark:text-cyan-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Controlled Thesaurus Matrix
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Clarivate Geneseq controlled indexing vocabulary
                  </p>
                </div>
              </div>

              {thesaurusFileName && (
                <button
                  onClick={handleResetThesaurus}
                  title="Reset to default core terms"
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload an official Clarivate thesaurus workbook (<code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">.xlsx</code> / <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">.xlsm</code>) to synchronize terms and disease activities. Unlisted terms receive an automatic <code className="font-mono text-amber-600 dark:text-amber-400 text-[11px]">@</code> prefix.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.xlsm"
              onChange={handleThesaurusUpload}
              className="hidden"
            />

            {/* Upload or Active Workbook Card */}
            {thesaurusFileName ? (
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {thesaurusFileName}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      {thesaurusCounts.totalLoaded.toLocaleString()} terms synced &bull; Ready for indexing
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingThesaurus}
                  className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded bg-white dark:bg-slate-800 shrink-0 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {loadingThesaurus ? 'Parsing...' : 'Replace File'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingThesaurus}
                className="w-full py-3 px-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2.5 cursor-pointer text-left"
              >
                <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {loadingThesaurus ? 'Parsing sheets...' : 'Upload Clarivate Thesaurus Workbook (.xlsx / .xlsm)'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Clarivate core dictionary active ({thesaurusCounts.totalLoaded.toLocaleString()} terms)
                  </div>
                </div>
              </button>
            )}

            {/* Controlled Vocabulary Domain Breakdown (Neat 3x2 Grid) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Controlled Vocabulary Status
                </span>
                <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                  {thesaurusCounts.totalLoaded.toLocaleString()} Total Terms
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {/* Disease */}
                <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Disease</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">/activity qualifier</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {thesaurusCounts.diseaseCount.toLocaleString()}
                  </span>
                </div>

                {/* Tech Focus */}
                <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Tech Focus</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Biotech methods</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    {thesaurusCounts.techCount.toLocaleString()}
                  </span>
                </div>

                {/* Seq Specific */}
                <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Seq Specific</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">CRISPR, CDRs, cDNA</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                    {thesaurusCounts.ssCount.toLocaleString()}
                  </span>
                </div>

                {/* Gene Symbols */}
                <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Gene Symbols</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Gene identifiers</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                    {thesaurusCounts.geneCount.toLocaleString()}
                  </span>
                </div>

                {/* Protein Targets */}
                <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Protein Targets</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Receptors &amp; targets</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400">
                    {thesaurusCounts.proteinCount.toLocaleString()}
                  </span>
                </div>

                {/* Descriptors */}
                <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Descriptors</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">General qualifiers</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                    {thesaurusCounts.uncatCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Rule Engine & Inspector Strip */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-300 font-medium">Clarivate Rule Engine:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Operational</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermBrowser(!showTermBrowser)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3 h-3" />
                  <span>{showTermBrowser ? 'Hide Inspector' : 'Lookup Terms'}</span>
                  {showTermBrowser ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60 pt-1.5">
                <span>Synonyms: <strong className="font-mono text-slate-700 dark:text-slate-300">{thesaurusCounts.preferredMappingCount.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Activities (/act): <strong className="font-mono text-slate-700 dark:text-slate-300">{thesaurusCounts.activityMappingCount.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Unlisted prefix: <strong className="font-mono text-amber-600 dark:text-amber-400">@term</strong></span>
              </div>
            </div>

            {/* Collapsible Vocabulary Search & Inspector */}
            {showTermBrowser && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2.5 animate-in fade-in duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search controlled terms (e.g. cancer, CRISPR, FASL, PCR)..."
                    value={termSearch}
                    onChange={(e) => setTermSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Category Filter Chips */}
                <div className="flex flex-wrap gap-1">
                  {(['All', 'Disease', 'Tech', 'SS', 'Gene', 'Protein', 'Uncategorised'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        selectedCategoryFilter === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Term List Table */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800/80 rounded bg-white dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {filteredTermsList.slice(0, 100).map(([lower, entry]) => (
                    <div key={lower} className="p-1.5 px-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-800 dark:text-slate-200 font-sans font-medium">{entry.original}</span>
                        {entry.activity && (
                          <span className="text-cyan-700 dark:text-cyan-300 text-[10px] bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/60 px-1.5 py-0.2 rounded font-sans">
                            /{entry.activity}
                          </span>
                        )}
                        {entry.preferred && (
                          <span className="text-amber-700 dark:text-amber-400 text-[10px] font-sans">
                            → {entry.preferred}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {Array.from(entry.categories).map((c) => (
                          <span
                            key={c}
                            className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-semibold ${
                              c === 'Disease'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800/60'
                                : c === 'Tech'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800/60'
                                : c === 'Gene'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800/60'
                                : c === 'Protein'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800/60'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredTermsList.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500 font-sans">
                      No matching controlled vocabulary terms found for "{termSearch}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Sequence Grid Initialization */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2.5 mb-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-emerald-600 dark:text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Initialize Master Sequence Grid
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Generate blank 20-column Clarivate standard template
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Specify the number of sequences in the patent (DNA, RNA, or Protein) to generate the standardized template with Seq 1 through Seq N.
            </p>

            <div className="space-y-3 mb-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Sequence Count
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={numSequences}
                  onChange={(e) => setNumSequences(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white font-mono text-xs tabular-nums focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => onInitializeGrid(numSequences)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Generate Grid
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500">Quick size:</span>
                {[10, 25, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setNumSequences(preset);
                      onInitializeGrid(preset);
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-mono tabular-nums border border-slate-200 dark:border-slate-800 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Existing File Upload Option */}
          <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onImportCSV(e.target.files[0]);
                }
              }}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Have an exported Clarivate sequence CSV?</span>
              <button
                onClick={() => csvInputRef.current?.click()}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                <span>Import File</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Active Master Grid State */}
          <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${totalSequences > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                Current Master Grid State
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {totalSequences > 0 ? `${totalSequences.toLocaleString()} sequences active` : '0 sequences'}
              </span>
            </div>

            {totalSequences > 0 ? (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                    Template ready for bulk indexing &amp; curation
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                    Seq 1 – Seq {totalSequences}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onContinueToEditor}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Open Bulk Editor</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  {onGoToGrid && (
                    <button
                      onClick={onGoToGrid}
                      className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      View Master Grid
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400">
                Specify sequence count above or import an exported Clarivate CSV file to populate the master sequence grid.
              </div>
            )}

            {/* Clarivate 20-Column Standard Specification reference */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 text-[11px] space-y-1">
              <span className="text-slate-800 dark:text-slate-300 font-medium block">
                Standard Clarivate 20-Field Template:
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                Generates SEQ ID NO, Organism (OS), Molecule Type (DNA/RNA/PRT), Feature (FT), Title/DE Line (max 72 chars), Keywords (KW), Disease /activity qualifiers, and Technology Domain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
