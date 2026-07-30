import React from 'react';
import { motion } from 'framer-motion';
import { Search, Edit3, ShieldCheck, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { TraceEvent } from '../types';

interface ExecutionVisualizerProps {
  currentTrace: TraceEvent[];
  isExecuting: boolean;
}

export const ExecutionVisualizer: React.FC<ExecutionVisualizerProps> = ({ currentTrace, isExecuting }) => {
  // Determine current active node & loop counts
  const lastEvent = currentTrace[currentTrace.length - 1];
  
  const getStepStatus = (stepName: string) => {
    const events = currentTrace.filter(t => t.step === stepName);
    if (!events.length) return 'pending';
    const last = events[events.length - 1];
    return last.status;
  };

  const researcherStatus = getStepStatus('Researcher');
  const writerStatus = getStepStatus('Writer');
  const reviewerStatus = getStepStatus('Reviewer');

  // Count self-correction loop iterations
  const revisionCount = currentTrace.filter(t => t.status === 'revision_requested').length;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-surfaceBorder/80 shadow-xl overflow-hidden relative">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">LangGraph Agent State Visualizer</h3>
            {isExecuting && (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-primary-500/15 border border-primary-500/30 text-[10px] font-bold text-primary-400">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-ping" />
                <span>LIVE STREAMING</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time graph orchestration & self-correction iteration machine</p>
        </div>

        {revisionCount > 0 && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-accent-amber text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Self-Correction Loop #{revisionCount}</span>
          </div>
        )}
      </div>

      {/* Nodes Flow Graph */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Node 1: Researcher */}
        <AgentNodeCard
          title="Researcher Agent"
          role="Hybrid Search & Chunk Synthesis"
          icon={<Search className="w-5 h-5 text-accent-cyan" />}
          status={researcherStatus}
          accentColor="cyan"
          activeDescription="Executing Dense + BM25 RRF Search..."
        />

        {/* Node 2: Writer */}
        <AgentNodeCard
          title="Writer Agent"
          role="Publication Markdown Drafting"
          icon={<Edit3 className="w-5 h-5 text-accent-violet" />}
          status={writerStatus}
          accentColor="violet"
          activeDescription="Drafting report sections & incorporating notes..."
        />

        {/* Node 3: Reviewer */}
        <AgentNodeCard
          title="Reviewer Agent"
          role="Factual Audit & Tone Verification"
          icon={<ShieldCheck className="w-5 h-5 text-accent-emerald" />}
          status={reviewerStatus}
          accentColor="emerald"
          activeDescription="Checking factual accuracy & grounding..."
        />
      </div>
    </div>
  );
};

interface AgentNodeCardProps {
  title: string;
  role: string;
  icon: React.ReactNode;
  status: string; // 'pending' | 'active' | 'completed' | 'revision_requested'
  accentColor: 'cyan' | 'violet' | 'emerald';
  activeDescription: string;
}

const AgentNodeCard: React.FC<AgentNodeCardProps> = ({ title, role, icon, status, accentColor, activeDescription }) => {
  const isPending = status === 'pending';
  const isActive = status === 'active';
  const isCompleted = status === 'completed';
  const isRevision = status === 'revision_requested';

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.02 : 1,
        borderColor: isActive
          ? 'rgba(99, 102, 241, 0.8)'
          : isCompleted
          ? 'rgba(16, 185, 129, 0.4)'
          : 'rgba(255, 255, 255, 0.08)',
      }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-xl border glass-panel relative overflow-hidden ${
        isActive ? 'ring-2 ring-primary-500/40 shadow-lg shadow-primary-500/20' : ''
      }`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-surfaceBorder/50">{icon}</div>
          <div>
            <h4 className="text-xs font-bold text-white">{title}</h4>
            <p className="text-[10px] text-slate-400">{role}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isPending && (
            <span className="px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-surfaceBorder/40 rounded-full border border-surfaceBorder">
              Pending
            </span>
          )}
          {isActive && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-bold text-primary-300 bg-primary-500/20 border border-primary-500/40 rounded-full animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>ACTIVE</span>
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold text-accent-emerald bg-accent-emerald/15 border border-accent-emerald/30 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span>PASSED</span>
            </span>
          )}
          {isRevision && (
            <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold text-accent-amber bg-accent-amber/15 border border-accent-amber/30 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>REVISION</span>
            </span>
          )}
        </div>
      </div>

      {/* Node Content / Subtext */}
      <div className="mt-2 text-[11px] text-slate-400 bg-background/50 rounded-lg p-2.5 border border-surfaceBorder/40 min-h-[44px]">
        {isActive ? (
          <span className="text-primary-300 font-medium flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-ping" />
            <span>{activeDescription}</span>
          </span>
        ) : isCompleted ? (
          <span className="text-slate-300">Phase finished cleanly. Passed metrics check.</span>
        ) : isRevision ? (
          <span className="text-accent-amber font-medium">Feedback dispatched to Writer. Re-evaluating...</span>
        ) : (
          <span className="text-slate-500">Waiting for graph activation turn...</span>
        )}
      </div>
    </motion.div>
  );
};
