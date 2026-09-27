import React from 'react';
import { Dna, Terminal, BookOpen, Download, Upload, AlertCircle, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  activeTab: 'setup' | 'bulk' | 'grid';
  setActiveTab: (tab: 'setup' | 'bulk' | 'grid') => void;
  onOpenColabModal: () => void;
  onOpenRulesModal: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  totalSequences: number;
  invalidDECount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenColabModal,
  onOpenRulesModal,
  onExportCSV,
  onImportCSV,
  totalSequences,
  invalidDECount,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCSV(e.target.files[0]);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b101d]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-700/60 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-2xs">
              <Dna className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
                  Clarivate Geneseq
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-800/60 font-medium">
                  Patent Indexer
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Standard 20-Column Processor
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Mode Selector */}
          <nav className="flex items-center p-1 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Setup &amp; Thesaurus
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'bulk'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Bulk Editor
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>Master Grid</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
                {totalSequences}
              </span>
              {invalidDECount > 0 && (
                <span
                  title={`${invalidDECount} sequences exceed 72-char DE limit`}
                  className="flex items-center text-amber-500 dark:text-amber-400"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Functional Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Switchable Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import sequence CSV"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Import</span>
            </button>

            <button
              onClick={onOpenColabModal}
              title="Get Python script for Google Colab"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">Colab Script</span>
            </button>

            <button
              onClick={onOpenRulesModal}
              title="View Geneseq Indexing Guidelines"
              className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
