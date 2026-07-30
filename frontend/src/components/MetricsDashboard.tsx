import React from 'react';
import { Activity, ShieldCheck, Target, Layers, Sparkles } from 'lucide-react';
import { RagasScore } from '../types';

interface MetricsDashboardProps {
  score?: RagasScore;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ score }) => {
  if (!score) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-surfaceBorder/80 text-center text-slate-500">
        <Activity className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
        <p className="text-xs font-semibold">Ragas Evaluation Analytics Pending</p>
        <p className="text-[11px] text-slate-600">Metrics will compute automatically upon report completion.</p>
      </div>
    );
  }

  const overallPercent = Math.round(score.overall_ragas_score * 100);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-surfaceBorder/80 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-accent-violet/15 border border-accent-violet/30 text-accent-violet">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ragas Evaluation & RAG Quality Analytics</h3>
            <p className="text-xs text-slate-400">Automated retrieval and faithfulness benchmark metrics</p>
          </div>
        </div>

        {/* Overall Score Badge */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600/20 to-accent-violet/20 border border-primary-500/40">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span className="text-xs font-bold text-slate-300">Overall Ragas Score:</span>
          <span className="text-base font-extrabold text-white">{overallPercent}%</span>
        </div>
      </div>

      {/* Grid of 4 Ragas metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Faithfulness */}
        <MetricCard
          title="Faithfulness"
          description="Source grounding & zero-hallucination accuracy"
          score={score.faithfulness}
          icon={<ShieldCheck className="w-4 h-4 text-accent-emerald" />}
          barColor="bg-accent-emerald"
        />

        {/* Metric 2: Answer Relevance */}
        <MetricCard
          title="Answer Relevance"
          description="Query alignment & structural completeness"
          score={score.answer_relevance}
          icon={<Target className="w-4 h-4 text-accent-cyan" />}
          barColor="bg-accent-cyan"
        />

        {/* Metric 3: Context Precision */}
        <MetricCard
          title="Context Precision"
          description="Signal-to-noise ratio in RRF search chunks"
          score={score.context_precision}
          icon={<Layers className="w-4 h-4 text-accent-violet" />}
          barColor="bg-accent-violet"
        />

        {/* Metric 4: Context Recall */}
        <MetricCard
          title="Context Recall"
          description="Extent of document info captured in report"
          score={score.context_recall}
          icon={<Activity className="w-4 h-4 text-accent-amber" />}
          barColor="bg-accent-amber"
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  description: string;
  score: number;
  icon: React.ReactNode;
  barColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, description, score, icon, barColor }) => {
  const percent = Math.round(score * 100);

  return (
    <div className="p-4 rounded-xl bg-background/60 border border-surfaceBorder/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <h4 className="text-xs font-bold text-white">{title}</h4>
        </div>
        <span className="text-xs font-extrabold text-slate-200">{percent}%</span>
      </div>

      <p className="text-[11px] text-slate-400 line-clamp-1">{description}</p>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-surfaceBorder rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
