import React from 'react';
import { Terminal, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { TraceEvent } from '../types';

interface AgentLogStreamProps {
  logs: TraceEvent[];
  isExecuting: boolean;
}

export const AgentLogStream: React.FC<AgentLogStreamProps> = ({ logs, isExecuting }) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-surfaceBorder/80 shadow-xl flex flex-col h-[320px]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-surfaceBorder/60">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-accent-cyan" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Agent Execution Logs & Trace Timeline</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {logs.length} Events Logged
        </span>
      </div>

      {/* Log items container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            No active research query running. Submit a query to trigger LangGraph multi-agent execution.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-2.5 p-2 rounded-lg bg-background/60 border border-surfaceBorder/40 hover:border-surfaceBorder transition-colors"
            >
              <div className="mt-0.5">
                {log.status === 'active' && <Loader2 className="w-3.5 h-3.5 text-primary-400 animate-spin" />}
                {log.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-accent-emerald" />}
                {log.status === 'revision_requested' && <AlertCircle className="w-3.5 h-3.5 text-accent-amber" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary-300 text-[11px]">
                    [{log.agent || log.step}]
                  </span>
                  <span className="text-[10px] text-slate-500">{log.status}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{log.message}</p>
                {log.details && (
                  <pre className="mt-1 text-[10px] text-slate-400 bg-surfaceBorder/30 p-1.5 rounded overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
