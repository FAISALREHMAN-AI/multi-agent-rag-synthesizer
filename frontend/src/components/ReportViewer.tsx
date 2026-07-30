import React, { useState } from 'react';
import { FileText, Copy, Check, Download, BookOpen } from 'lucide-react';

interface ReportViewerProps {
  content: string;
  query: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ content, query }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthetix_research_report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!content) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-surfaceBorder/80 text-center text-slate-500">
        <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-medium">No synthesized report generated yet.</p>
        <p className="text-xs text-slate-600 mt-1">Submit a research query above to trigger autonomous agent synthesis.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-surfaceBorder/80 shadow-2xl overflow-hidden">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surfaceBorder/60 bg-surfaceBorder/20">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-primary-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Synthesized Publication Report</h3>
            <p className="text-[11px] text-slate-400 truncate max-w-md">Query: {query}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surfaceBorder/40 hover:bg-surfaceBorder text-slate-300 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors shadow-md shadow-primary-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .MD</span>
          </button>
        </div>
      </div>

      {/* Render Markdown Content cleanly */}
      <div className="p-8 prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4 font-sans overflow-y-auto max-h-[750px]">
        {content.split('\n').map((line, idx) => {
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-xl font-extrabold text-white border-b border-surfaceBorder pb-2 mb-4 mt-2">{line.replace('# ', '')}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-base font-bold text-primary-300 mt-6 mb-2">{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-sm font-semibold text-accent-cyan mt-4 mb-1">{line.replace('### ', '')}</h3>;
          }
          if (line.startsWith('> ')) {
            return <blockquote key={idx} className="border-l-4 border-primary-500 pl-4 py-1.5 my-2 text-slate-300 italic bg-primary-500/10 rounded-r-lg text-xs">{line.replace('> ', '')}</blockquote>;
          }
          if (line.startsWith('- ')) {
            return <li key={idx} className="ml-4 list-disc text-slate-300">{line.replace('- ', '')}</li>;
          }
          if (line.trim() === '---') {
            return <hr key={idx} className="border-surfaceBorder my-4" />;
          }
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx} className="text-slate-300">{line}</p>;
        })}
      </div>
    </div>
  );
};
