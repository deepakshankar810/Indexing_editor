import React from 'react';
import { X, BookOpen, AlertTriangle, FileSpreadsheet, Tag, ExternalLink } from 'lucide-react';

interface GeneseqRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeneseqRulesModal: React.FC<GeneseqRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0b101b]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-50 dark:bg-slate-800 rounded text-blue-600 dark:text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Clarivate Geneseq Indexing Guidelines
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Standard formatting rules from Geneseq manual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Rule 1: DE Line 72 characters limit */}
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Description Line (DE Line): 72-Character Upper Limit</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The DE line in Geneseq must never exceed <strong>72 characters</strong>. This application contains a live character counter that warns the analyst the moment text crosses this limit.
            </p>
            <div className="mt-1 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded font-mono text-[11px] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80">
              Example: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Homo sapiens FASL gene, SEQ ID NO: 3</span> (≤ 72 chars)
            </div>
          </div>

          {/* Rule 2: Custom Keywords with @ prefix */}
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 font-semibold">
              <Tag className="w-3.5 h-3.5 shrink-0" />
              <span>Custom Terms: Controlled Vocabulary '@' Prefix</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Any indexing keyword not present in Clarivate's official controlled vocabulary must be prepended with an <code className="text-amber-600 dark:text-amber-400 font-mono">@</code> symbol (e.g., <code className="text-amber-600 dark:text-amber-400 font-mono">@monoclonal antibody</code>, <code className="text-amber-600 dark:text-amber-400 font-mono">@variable region</code>). The editor manages this rule automatically.
            </p>
          </div>

          {/* Rule 3: Multiple Organisms & Comments Format */}
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Multiple Organism Names &amp; Strain Comments</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Multiple organisms are serialized with semicolon delimiters (<code className="font-mono text-slate-800 dark:text-slate-200">;</code>), with organism name separated from strain/comment with a dollar sign (<code className="font-mono text-slate-800 dark:text-slate-200">$</code>).
            </p>
            <div className="mt-1 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded font-mono text-[11px] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80">
              Output: <span className="text-emerald-600 dark:text-emerald-400">Homo sapiens$strain XYZ;Teschovirus A$;Escherichia coli$K-12</span>
            </div>
          </div>

          {/* Rule 4: Referred to Location Hierarchy */}
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-1">
            <h4 className="font-semibold text-slate-900 dark:text-slate-200">Sequence Location Hierarchy</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Precedence when citing sequence mentions: <strong>1. Claim</strong> (e.g. Claim 1) &gt; <strong>2. Example</strong> (e.g. Example 4) &gt; <strong>3. Disclosure Y</strong>.
            </p>
          </div>

          {/* Link to NCBI */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              Search scientific taxonomy and organism nomenclature:
            </div>
            <a
              href="https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              <span>NCBI Taxonomy</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b101b] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 dark:hover:text-white text-xs font-medium rounded-md transition-colors border border-slate-300 dark:border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
