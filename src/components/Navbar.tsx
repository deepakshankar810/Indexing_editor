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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-xs transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700/80 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
                <Dna className="w-4.5 h-4.5" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
                  Clarivate Geneseq
                </span>
                <span className="hidden md:inline text-xs text-slate-500 font-normal">
                  <span className="mr-2 text-slate-300 dark:text-slate-700">/</span>
                  Patent Sequence Indexing
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Mode Selector */}
          <nav className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'setup'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Setup &amp; Thesaurus
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'bulk'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Bulk Editor
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Master Grid
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                ({totalSequences})
              </span>
              {invalidDECount > 0 && (
                <span
                  title={`${invalidDECount} sequences exceed 72-char DE limit`}
                  className="flex items-center text-amber-500 dark:text-amber-400"
                >
                  <AlertCircle className="w-3 h-3" />
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Functional Actions & Switchable Theme */}
          <div className="flex items-center gap-2">
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
              className="inline-flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import sequence CSV"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={onOpenColabModal}
              title="Get Python script for Google Colab"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden md:inline">Colab Script</span>
            </button>

            <button
              onClick={onOpenRulesModal}
              title="View Geneseq Indexing Guidelines"
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-md border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors"
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
