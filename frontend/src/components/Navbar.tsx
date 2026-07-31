import React from 'react';
import { Cpu, Layers, Sparkles, FolderPlus } from 'lucide-react';

interface NavbarProps {
  onOpenNewProject: () => void;
  activeProjectTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewProject, activeProjectTitle }) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-surfaceBorder/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-accent-violet to-accent-cyan flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                SYNTHETIX <span className="text-primary-500 font-black">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full uppercase">
                v2.0 Standalone
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Multi-Agent RAG & Knowledge Synthesizer</p>
          </div>
        </div>

        {/* Active Project Title & Quick Actions */}
        <div className="flex items-center space-x-4">
          {activeProjectTitle && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surfaceBorder/40 border border-surfaceBorder text-xs text-slate-300">
              <Layers className="w-3.5 h-3.5 text-primary-500" />
              <span className="font-medium text-slate-200">{activeProjectTitle}</span>
            </div>
          )}

          <button
            onClick={onOpenNewProject}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-accent-violet hover:from-primary-500 hover:to-accent-violet text-white text-xs font-semibold shadow-md shadow-primary-600/20 hover:shadow-primary-600/40 transition-all duration-200"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Knowledge Project</span>
          </button>
        </div>
      </div>
    </header>
  );
};
