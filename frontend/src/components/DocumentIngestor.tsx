import React, { useState } from 'react';
import { FileText, Globe, Github, Upload, X, CheckCircle, Loader2 } from 'lucide-react';

interface DocumentIngestorProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

export const DocumentIngestor: React.FC<DocumentIngestorProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [title, setTitle] = useState('');
  const [urls, setUrls] = useState('');
  const [githubRepos, setGithubRepos] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      let res;

      if (files.length === 0) {
        res = await fetch(`${API_BASE}/api/v1/projects/json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            urls: urls || null,
            github_repos: githubRepos || null,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append('title', title);
        if (urls) formData.append('urls', urls);
        if (githubRepos) formData.append('github_repos', githubRepos);

        files.forEach((file) => {
          formData.append('pdf_files', file);
        });

        res = await fetch(`${API_BASE}/api/v1/projects/`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) throw new Error('Failed to create project');
      const project = await res.json();
      
      onProjectCreated(project);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error creating project and ingesting documents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-panel border border-surfaceBorder rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surfaceBorder/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Create Multi-Source Knowledge Project</h2>
            <p className="text-xs text-slate-400">Ingest PDFs, Web Pages, and GitHub Repositories for hybrid RAG search.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. LLM Multi-Agent System Architecture Deep Dive"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-surfaceBorder focus:border-primary-500 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-slate-500"
            />
          </div>

          {/* PDF Files Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-accent-cyan" />
              <span>PDF Documents</span>
            </label>
            <div className="border-2 border-dashed border-surfaceBorder hover:border-primary-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-background/50">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer block">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-medium text-slate-300">Click to upload PDFs or drag and drop</span>
                <p className="text-[11px] text-slate-500 mt-0.5">SupportsPyMuPDF clean text & table extraction</p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center text-xs text-slate-300 space-x-2 bg-surfaceBorder/30 px-2.5 py-1 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-accent-emerald" />
                    <span className="truncate">{f.name}</span>
                    <span className="text-[10px] text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Web URLs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-accent-emerald" />
              <span>Web Page URLs (Comma separated)</span>
            </label>
            <input
              type="text"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="e.g. https://arxiv.org/html/2312.10997v5, https://langchain.com/blog/multi-agent"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-surfaceBorder focus:border-accent-emerald text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent-emerald placeholder-slate-500"
            />
          </div>

          {/* GitHub Repos */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <Github className="w-3.5 h-3.5 text-accent-violet" />
              <span>GitHub Repositories (Comma separated)</span>
            </label>
            <input
              type="text"
              value={githubRepos}
              onChange={(e) => setGithubRepos(e.target.value)}
              placeholder="e.g. https://github.com/langchain-ai/langgraph, https://github.com/qdrant/qdrant"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-surfaceBorder focus:border-accent-violet text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent-violet placeholder-slate-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-surfaceBorder/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-surfaceBorder/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-violet hover:from-primary-500 hover:to-accent-violet text-white text-xs font-bold shadow-lg shadow-primary-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ingesting Documents...</span>
                </>
              ) : (
                <span>Ingest & Create Project</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
