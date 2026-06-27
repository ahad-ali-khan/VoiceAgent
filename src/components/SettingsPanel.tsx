import React, { useState } from 'react';
import { X, Key, Trash2, Save, ExternalLink } from 'lucide-react';

interface SettingsPanelProps {
  apiKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  apiKey,
  onSave,
  onClear,
  onClose,
}) => {
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) {
      setError('Key cannot be empty');
      return;
    }
    if (!newKey.startsWith('AIzaSy')) {
      setError('Invalid format. Gemini keys usually start with "AIzaSy"');
      return;
    }
    onSave(newKey.trim());
    setNewKey('');
    setError('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const getMaskedKey = () => {
    if (!apiKey) return '';
    return `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>

      <div className="w-full max-w-sm border-l border-zinc-800 bg-zinc-950 p-6 flex flex-col h-full shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
          <div className="flex items-center gap-2 text-zinc-200">
            <Key className="h-4 w-4 text-zinc-400" />
            <span className="font-bold text-xs uppercase tracking-wider font-mono">BYOK Settings</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6">
          {/* Active Key Status */}
          <div className="rounded border border-zinc-900 bg-zinc-900/40 p-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Active Key</h3>
            {apiKey ? (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-zinc-300 bg-zinc-950 px-2 py-1.5 rounded border border-zinc-900 break-all select-none">
                  {getMaskedKey()}
                </span>
                <button
                  onClick={() => {
                    onClear();
                    setError('');
                  }}
                  className="rounded p-2 text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors border border-red-950/30"
                  title="Clear API Key"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-red-400 font-mono">No API key configured.</p>
            )}
          </div>

          {/* Update Key Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                Update API Key
              </label>
              <input
                type="password"
                placeholder="Paste new Gemini key..."
                value={newKey}
                onChange={(e) => {
                  setNewKey(e.target.value);
                  setError('');
                  setSuccess(false);
                }}
                className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:border-zinc-600 focus:outline-none font-mono"
              />
              {error && <p className="mt-1 text-xs text-red-500 font-mono">{error}</p>}
              {success && <p className="mt-1 text-xs text-green-500 font-mono">Key saved successfully!</p>}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition-colors uppercase tracking-wider font-mono"
            >
              <Save className="h-3 w-3" /> Save Key
            </button>
          </form>
        </div>

        <div className="border-t border-zinc-900 pt-4 mt-auto">
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 font-mono transition-colors"
          >
            Google AI Studio <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
