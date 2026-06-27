import React, { useState } from 'react';
import type { ThoughtStep } from '../lib/agent';
import { Play, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ThoughtStreamProps {
  steps: ThoughtStep[];
}

export const ThoughtStream: React.FC<ThoughtStreamProps> = ({ steps }) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedStep === id) {
      setExpandedStep(null);
    } else {
      setExpandedStep(id);
    }
  };

  if (steps.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-6 border border-zinc-900 bg-zinc-950/80 rounded-lg p-5 font-mono shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Thought Stream Console</span>
        </div>
        <span className="text-[9px] text-zinc-600">AGENT LOG</span>
      </div>

      <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
        {steps.map((step) => {
          const isExpanded = expandedStep === step.id;
          const hasDetails = !!step.details;

          return (
            <div key={step.id} className="border-b border-zinc-900/40 pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-600 mt-0.5 select-none">{step.timestamp}</span>
                  
                  {step.status === 'running' && (
                    <Play className="h-3.5 w-3.5 text-zinc-400 animate-pulse shrink-0 mt-0.5" />
                  )}
                  {step.status === 'success' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  {step.status === 'error' && (
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  {step.status === 'pending' && (
                    <AlertCircle className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5" />
                  )}

                  <span className={`text-xs select-text break-words leading-relaxed ${
                    step.status === 'success' ? 'text-zinc-300 font-semibold' : step.status === 'error' ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {step.message}
                  </span>
                </div>

                {hasDetails && (
                  <button
                    onClick={() => toggleExpand(step.id)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>

              {isExpanded && step.details && (
                <div className="mt-2 ml-16 p-2 bg-zinc-900/60 rounded border border-zinc-900 text-[10px] text-zinc-400 leading-relaxed max-w-full overflow-x-auto whitespace-pre-wrap select-text">
                  {step.details}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
