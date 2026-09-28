import React, { useState } from 'react';
import { Copy, Check, Download, X, Terminal, CheckCircle2 } from 'lucide-react';
import { COLAB_PYTHON_SCRIPT } from '../data/colabPythonScript';

interface ColabScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColabScriptModal: React.FC<ColabScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(COLAB_PYTHON_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([COLAB_PYTHON_SCRIPT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geneseq_indexing_app.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0b101b]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-50 dark:bg-slate-800 rounded text-amber-600 dark:text-amber-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Google Colab Python Script (Optimized &amp; 72-Char Counter)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gradio workspace with latency elimination and active DE length validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Technical Improvements Unboxed Bar */}
        <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Zero-Lag 72-Char DE:</strong> Instant client-side length gauge &amp; warning alerts.
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span>
              <strong>Preferred &amp; USE ALSO:</strong> Automatic keyword replacement &amp; expansion.
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              <strong>Col 8 Gene/Protein:</strong> Retains original symbol with preferred term.
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Col 9 Tech Focus:</strong> General Descriptors routed directly to Col 9.
            </span>
          </div>
        </div>

        {/* Runtime notice */}
        <div className="px-5 py-2 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-blue-800 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-900/80 text-[10px] font-mono uppercase">
              Colab Runtime: Python 3
            </span>
            <span>
              Ensure notebook runtime is set to <strong>Python 3</strong> (Menu: <em>Runtime &rarr; Change runtime type &rarr; Python 3</em>).
            </span>
          </div>
          <span className="text-[10px] opacity-75 hidden sm:inline">
            Self-installing: gradio, pandas, openpyxl auto-installed on run
          </span>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed selection:bg-blue-600 selection:text-white">
          <pre className="whitespace-pre overflow-x-auto">
            {COLAB_PYTHON_SCRIPT}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b101b] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            Paste into a Google Colab code cell &bull; Clean Light Theme &bull; Zero external configuration needed
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py</span>
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Python Code'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
