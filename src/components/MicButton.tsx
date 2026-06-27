import React from 'react';
import { Mic, Square } from 'lucide-react';

interface MicButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  onClick,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
          isRecording
            ? 'bg-red-600 text-white animate-breath shadow-lg shadow-red-600/50 scale-105'
            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-900/80 cursor-pointer shadow-md'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {isRecording ? (
          <Square className="h-8 w-8 fill-current" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>
      
      <span className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        {isRecording ? 'Listening (click to stop)' : 'Click to Speak'}
      </span>
    </div>
  );
};
