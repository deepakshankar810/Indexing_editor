import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SetupTab } from './components/SetupTab';
import { BulkEditorTab } from './components/BulkEditorTab';
import { MasterGridTab } from './components/MasterGridTab';
import { ColabScriptModal } from './components/ColabScriptModal';
import { GeneseqRulesModal } from './components/GeneseqRulesModal';
import { SequenceRow, BulkEditState, TermEntry } from './types';
import { createDefaultTermMap } from './data/defaultThesaurus';
import {
  createInitialRows,
  applyBulkEditsToRows,
  exportToCSV,
  parseClarivateCSV,
} from './utils/sequenceProcessor';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const getInitialBulkState = (): BulkEditState => ({
  targetRange: 'all',
  sequenceType: '',
  moleculeType: '',
  refLocType: 'Skip',
  refLocNum: '',
  physLocType: 'Skip',
  physLocVal: '',
  organismListText: '',
  organismTypes: [],
  diseaseKeywords: [],
  includeDiseaseActivity: true,
  techKeywords: [],
  ssKeywords: [],
  geneKeywords: [],
  proteinKeywords: [],
  uncatKeywords: [],
  keepOriginalSS: true,
  deBase: '',
  commentsBase: '',
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'setup' | 'bulk' | 'grid'>('bulk');
  const [numSequences, setNumSequences] = useState<number>(10);
  const [rows, setRows] = useState<SequenceRow[]>(() => createInitialRows(10));
  const [termMap, setTermMap] = useState<Map<string, TermEntry>>(() => createDefaultTermMap());
  const [bulkState, setBulkState] = useState<BulkEditState>(getInitialBulkState());

  // Switchable Theme (Dark by default, toggles to Light)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('clarivate_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('clarivate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Modals
  const [isColabModalOpen, setIsColabModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Dropdown choices from termMap
  const dropdownChoices = useMemo(() => {
    const diseaseSet = new Set<string>();
    const techSet = new Set<string>();
    const ssSet = new Set<string>();
    const geneSet = new Set<string>();
    const proteinSet = new Set<string>();
    const uncatSet = new Set<string>();

    for (const entry of termMap.values()) {
      if (entry.categories.has('Disease')) diseaseSet.add(entry.original);
      if (entry.categories.has('Tech')) techSet.add(entry.original);
      if (entry.categories.has('SS')) ssSet.add(entry.original);
      if (entry.categories.has('Gene')) geneSet.add(entry.original);
      if (entry.categories.has('Protein')) proteinSet.add(entry.original);
      if (entry.categories.has('Uncategorised')) uncatSet.add(entry.original);
    }

    return {
      Disease: Array.from(diseaseSet).sort(),
      Tech: Array.from(techSet).sort(),
      SS: Array.from(ssSet).sort(),
      Gene: Array.from(geneSet).sort(),
      Protein: Array.from(proteinSet).sort(),
      Uncategorised: Array.from(uncatSet).sort(),
    };
  }, [termMap]);

  const invalidDECount = useMemo(() => {
    return rows.filter((r) => r.deLine && r.deLine.length > 72).length;
  }, [rows]);

  // Grid initialization
  const handleInitializeGrid = (count: number) => {
    const newRows = createInitialRows(count);
    setRows(newRows);
    showToast(`Initialized master grid with ${count} sequence rows.`, 'success');
    setActiveTab('bulk');
  };

  // Apply Bulk Edits
  const handleApplyEdits = () => {
    if (rows.length === 0) {
      showToast('Master grid is empty. Please initialize sequences first.', 'warn');
      return;
    }

    const updated = applyBulkEditsToRows(rows, bulkState, termMap);
    setRows(updated);

    const targetDesc = bulkState.targetRange === 'all' ? `all ${rows.length}` : `target`;
    showToast(`Successfully applied indexing rules to ${targetDesc} sequences!`, 'success');
    setActiveTab('grid');
  };

  // Clear Bulk Editor
  const handleClearEditor = () => {
    setBulkState(getInitialBulkState());
    showToast('Bulk editor fields reset to defaults.', 'info');
  };

  // Clear Master Grid
  const handleClearGrid = () => {
    setRows([]);
    showToast('Master grid cleared. Click "Add Row" or "Re-initialize" to start fresh.', 'info');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (rows.length === 0) {
      showToast('Nothing to export. Initialize or add rows first.', 'warn');
      return;
    }

    if (invalidDECount > 0) {
      showToast(`Warning: ${invalidDECount} sequence(s) have DE lines > 72 characters.`, 'warn');
    }

    const csvContent = exportToCSV(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Geneseq_Final_Import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Geneseq_Final_Import.csv downloaded successfully!', 'success');
  };

  // Import CSV
  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseClarivateCSV(text);
        if (parsed.length > 0) {
          setRows(parsed);
          setNumSequences(parsed.length);
          showToast(`Imported ${parsed.length} sequences from ${file.name}`, 'success');
          setActiveTab('grid');
        } else {
          showToast('Could not find sequence data in CSV.', 'warn');
        }
      } catch (err) {
        console.error('Error importing CSV:', err);
        showToast('Failed to parse CSV file.', 'warn');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-150">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenColabModal={() => setIsColabModalOpen(true)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        totalSequences={rows.length}
        invalidDECount={invalidDECount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-150">
          <div
            className={`px-3.5 py-2 rounded-lg shadow-xl border flex items-center gap-2 text-xs font-medium ${
              toastMessage.type === 'success'
                ? 'bg-white dark:bg-[#0e1726] border-emerald-300 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-200'
                : toastMessage.type === 'warn'
                ? 'bg-white dark:bg-[#1b140c] border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-200'
                : 'bg-white dark:bg-[#0f172a] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'warn' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {activeTab === 'setup' && (
          <SetupTab
            termMap={termMap}
            setTermMap={setTermMap}
            numSequences={numSequences}
            setNumSequences={setNumSequences}
            onInitializeGrid={handleInitializeGrid}
            onImportCSV={handleImportCSV}
            onContinueToEditor={() => setActiveTab('bulk')}
            totalSequences={rows.length}
            onGoToGrid={() => setActiveTab('grid')}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkEditorTab
            bulkState={bulkState}
            setBulkState={setBulkState}
            termMap={termMap}
            dropdownChoices={dropdownChoices}
            totalSequences={rows.length}
            onApplyEdits={handleApplyEdits}
            onClearEditor={handleClearEditor}
            onGoToGrid={() => setActiveTab('grid')}
          />
        )}

        {activeTab === 'grid' && (
          <MasterGridTab
            rows={rows}
            setRows={setRows}
            onExportCSV={handleExportCSV}
            onClearGrid={handleClearGrid}
            onGoToBulkEditor={() => setActiveTab('bulk')}
          />
        )}
      </main>

      {/* Colab Python Script Modal */}
      <ColabScriptModal
        isOpen={isColabModalOpen}
        onClose={() => setIsColabModalOpen(false)}
      />

      {/* Geneseq Rules Guidelines Modal */}
      <GeneseqRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
