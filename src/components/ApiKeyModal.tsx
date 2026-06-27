import React, { useState } from 'react';
import { Key, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setError('API key cannot be empty');
      return;
    }
    if (!keyInput.startsWith('AIzaSy')) {
      setError('Invalid API key format. Gemini API keys usually start with "AIzaSy"');
      return;
    }
    onSave(keyInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4 mb-4">
          <div className="rounded-md bg-zinc-900 p-2 text-zinc-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-wider font-mono">Setup API Key</h2>
            <p className="text-xs text-zinc-500">Provide a Gemini API Key to start</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            This app uses Google Gemini 2.5 Flash for audio classification, web grounding, and multi-step orchestration.
            Your key is stored locally in your browser (<code className="bg-zinc-900 px-1 rounded">voiceagent_gemini_key</code>) and sent directly to Google AI APIs.
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setError('');
              }}
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
            />
            {error && <p className="mt-1 text-xs text-red-500 font-mono">{error}</p>}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
            >
              Get a free API key <ExternalLink className="h-3 w-3" />
            </a>

            <button
              type="submit"
              className="rounded bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition-colors uppercase tracking-wider font-mono"
            >
              Save Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
