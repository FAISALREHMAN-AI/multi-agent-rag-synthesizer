import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Folder, FileCheck, Play, Loader2, ArrowRight } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DocumentIngestor } from './components/DocumentIngestor';
import { ExecutionVisualizer } from './components/ExecutionVisualizer';
import { AgentLogStream } from './components/AgentLogStream';
import { ReportViewer } from './components/ReportViewer';
import { MetricsDashboard } from './components/MetricsDashboard';
import { Project, TraceEvent, RagasScore } from './types';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [queryText, setQueryText] = useState('');
  
  // Execution & SSE State
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<TraceEvent[]>([]);
  const [reportContent, setReportContent] = useState('');
  const [ragasScore, setRagasScore] = useState<RagasScore | undefined>(undefined);
  const [activeQuery, setActiveQuery] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Fetch list of projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/projects/`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !activeProject) {
          fetchProjectDetails(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch projects:", e);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data);
        if (data.reports && data.reports.length > 0) {
          const latest = data.reports[0];
          setReportContent(latest.content);
          setRagasScore(latest.ragas_score);
          setActiveQuery(latest.query);
        } else {
          setReportContent('');
          setRagasScore(undefined);
        }
      }
    } catch (e) {
      console.error("Failed to fetch project details:", e);
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setActiveProject(newProject);
    setReportContent('');
    setRagasScore(undefined);
    setLogs([]);
  };

  const handleExecuteQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim() || !activeProject) return;

    const query = queryText.trim();
    setActiveQuery(query);
    setIsExecuting(true);
    setLogs([]);
    setReportContent('');
    setRagasScore(undefined);

    try {
      // 1. Subscribe to SSE Stream
      const eventSource = new EventSource(`${API_BASE}/api/v1/stream/${activeProject.id}`);

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          if (parsed.event === 'step_update') {
            setLogs((prev) => [...prev, parsed.data]);
          } else if (parsed.event === 'workflow_complete') {
            setReportContent(parsed.data.final_report);
            setRagasScore(parsed.data.ragas_score);
            setIsExecuting(false);
            eventSource.close();
            fetchProjectDetails(activeProject.id);
          }
        } catch (err) {
          console.error("Error parsing SSE event:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE stream error:", err);
        eventSource.close();
        setIsExecuting(false);
      };

      // 2. Trigger Query Execution API
      const res = await fetch(`${API_BASE}/api/v1/query/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeProject.id,
          query: query,
        }),
      });

      if (!res.ok) {
        throw new Error('Query trigger failed');
      }

    } catch (err) {
      console.error(err);
      alert('Error triggering multi-agent query execution.');
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar
        onOpenNewProject={() => setIsModalOpen(true)}
        activeProjectTitle={activeProject?.title}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Project Selector Bar & Stats */}
        <div className="glass-panel rounded-2xl p-5 border border-surfaceBorder/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Project</span>
              <div className="flex items-center space-x-2">
                <select
                  value={activeProject?.id || ''}
                  onChange={(e) => fetchProjectDetails(e.target.value)}
                  className="bg-background border border-surfaceBorder rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-primary-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.document_count || 1} docs)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {activeProject && (
            <div className="flex items-center space-x-6 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-accent-cyan" />
                <span>Indexed Docs: <strong className="text-slate-200">{activeProject.documents?.length || 1}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-accent-violet" />
                <span>Hybrid RAG Engine: <strong className="text-slate-200">Dense + BM25 RRF</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Research Query Input Box */}
        <div className="glass-panel rounded-2xl p-6 border border-surfaceBorder/80 shadow-2xl relative">
          <form onSubmit={handleExecuteQuery} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Search className="w-4 h-4 text-primary-400" />
                <span>Autonomous Multi-Agent Research Query</span>
              </label>
              <span className="text-[11px] text-slate-400">LangGraph Orchestrated Loop</span>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="e.g. Synthesize system architecture, empirical benchmarks, and trade-offs of multi-modal agents..."
                disabled={isExecuting || !activeProject}
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-surfaceBorder focus:border-primary-500 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-slate-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isExecuting || !queryText.trim() || !activeProject}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 via-accent-violet to-accent-cyan hover:opacity-95 text-white text-xs font-extrabold shadow-lg shadow-primary-500/25 disabled:opacity-50 transition-all duration-200"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Workflow...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Synthesize Knowledge</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Execution Visualizer */}
        <ExecutionVisualizer currentTrace={logs} isExecuting={isExecuting} />

        {/* Execution Log Stream */}
        <AgentLogStream logs={logs} isExecuting={isExecuting} />

        {/* Ragas Quality Metrics Dashboard */}
        <MetricsDashboard score={ragasScore} />

        {/* Markdown Report Viewer */}
        <ReportViewer content={reportContent} query={activeQuery} />
      </main>

      {/* Document Ingestion Modal */}
      <DocumentIngestor
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
