import { useState, useEffect } from 'react';
import { Settings, Globe, FileText, Layers, RefreshCw, AudioLines } from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SettingsPanel } from './components/SettingsPanel';
import { MicButton } from './components/MicButton';
import { FileUpload } from './components/FileUpload';
import { ThoughtStream } from './components/ThoughtStream';
import { ResultCard } from './components/ResultCard';
import { SpeechRecognitionHelper } from './lib/speech';
import { runVoiceAgent } from './lib/agent';
import type { ThoughtStep, AgentMode } from './lib/agent';

const LOCAL_STORAGE_KEY = 'voiceagent_gemini_key';

function App() {
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Speech and Transcription State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [speechHelper, setSpeechHelper] = useState<SpeechRecognitionHelper | null>(null);
  const [speechError, setSpeechError] = useState<string>('');

  // File Upload State
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  // Agent Execution State
  const [agentMode, setAgentMode] = useState<AgentMode | null>(null);
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);

  // Load API Key on Mount
  useEffect(() => {
    const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowKeyModal(true);
    }
  }, []);

  // Initialize Speech Recognition Helper
  useEffect(() => {
    if (!SpeechRecognitionHelper.isSupported()) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Chrome, Safari or Edge.');
      return;
    }

    const helper = new SpeechRecognitionHelper({
      onResult: (text, _isFinal) => {
        setTranscript(text);
      },
      onEnd: () => {
        setIsRecording(false);
      },
      onError: (err) => {
        setSpeechError(`Speech error: ${err}`);
        setIsRecording(false);
      },
    });

    setSpeechHelper(helper);
  }, []);

  // Save Key Callback
  const handleSaveKey = (key: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, key);
    setApiKey(key);
    setShowKeyModal(false);
  };

  // Clear Key Callback
  const handleClearKey = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setApiKey('');
    setShowKeyModal(true);
    setShowSettings(false);
  };

  // Toggle Recording
  const handleMicClick = () => {
    if (!speechHelper) return;

    if (isRecording) {
      speechHelper.stop();
      // Wait briefly for final results to settle before running agent
      setTimeout(() => {
        triggerAgent();
      }, 500);
    } else {
      setTranscript('');
      setSpeechError('');
      setFinalResult(null);
      setThoughtSteps([]);
      setAgentMode(null);
      setIsRecording(true);
      speechHelper.start();
    }
  };

  // Trigger Gemini Agent
  const triggerAgent = async () => {
    const activeTranscript = transcript || '';
    if (!activeTranscript.trim()) {
      setSpeechError('No query spoken. Please try again.');
      return;
    }

    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    setIsAgentRunning(true);
    setFinalResult(null);
    setThoughtSteps([]);

    await runVoiceAgent({
      apiKey,
      prompt: activeTranscript,
      fileContent: fileContent || undefined,
      fileName: fileName || undefined,
      onStep: (steps) => {
        setThoughtSteps(steps);
      },
      onModeSelected: (mode) => {
        setAgentMode(mode);
      },
      onResult: (result) => {
        setFinalResult(result);
        setIsAgentRunning(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col items-center justify-start p-4 relative antialiased selection:bg-zinc-800 select-none">
      
      {/* Top Navbar */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-zinc-900 pb-4 mb-8 pt-2">
        <div className="flex items-center gap-2">
          <AudioLines className="h-5 w-5 text-zinc-400" />
          <h1 className="text-sm font-bold tracking-widest uppercase font-mono text-zinc-200">
            VoiceAgent
          </h1>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="rounded-md border border-zinc-900 bg-zinc-950 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
          title="BYOK settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl flex-1 flex flex-col items-center justify-start space-y-6">
        
        {/* Mode Indicators */}
        <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-900 px-4 py-2 rounded-full text-[10px] font-mono text-zinc-500 shadow-md">
          <span className="uppercase tracking-widest text-[9px] mr-1">Modes:</span>
          <span className={`flex items-center gap-1 transition-colors ${agentMode === 'Search' ? 'text-cyan-400 font-bold' : ''}`}>
            <Globe className="h-3.5 w-3.5" /> Search
          </span>
          <span className="text-zinc-800">|</span>
          <span className={`flex items-center gap-1 transition-colors ${agentMode === 'File' ? 'text-emerald-400 font-bold' : ''}`}>
            <FileText className="h-3.5 w-3.5" /> File
          </span>
          <span className="text-zinc-800">|</span>
          <span className={`flex items-center gap-1 transition-colors ${agentMode === 'Multi-step' ? 'text-amber-400 font-bold' : ''}`}>
            <Layers className="h-3.5 w-3.5" /> Multi-Step
          </span>
        </div>

        {/* Dynamic File Upload - appears either if we set it up beforehand or if File Analysis mode is selected */}
        <div className="w-full">
          <FileUpload
            fileName={fileName}
            onFileLoaded={(name, content) => {
              setFileName(name);
              setFileContent(content);
              // Auto select File mode preview indicators
              setAgentMode('File');
            }}
            onClearFile={() => {
              setFileName(null);
              setFileContent('');
              if (agentMode === 'File') {
                setAgentMode(null);
              }
            }}
          />
        </div>

        {/* Large Central Microphone */}
        <MicButton
          isRecording={isRecording}
          onClick={handleMicClick}
          disabled={isAgentRunning || !speechHelper}
        />

        {/* Browser Support Errors */}
        {speechError && (
          <p className="text-xs text-red-500 font-mono text-center max-w-md bg-red-950/20 border border-red-900/40 p-2.5 rounded">
            {speechError}
          </p>
        )}

        {/* Live Transcription Output */}
        {(transcript || isRecording) && (
          <div className="w-full max-w-xl mx-auto bg-zinc-950/40 border border-zinc-900 rounded-lg p-4 font-mono shadow-md">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 select-none">Live Transcription</p>
            <p className="text-sm text-zinc-300 leading-relaxed min-h-6 break-words select-text">
              {transcript || <span className="text-zinc-600 italic">Listening for speech...</span>}
            </p>
          </div>
        )}

        {/* Custom Actions bar */}
        {!isRecording && transcript && !isAgentRunning && (
          <button
            onClick={triggerAgent}
            className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 text-xs font-mono transition-colors shadow-sm"
          >
            <RefreshCw className="h-3 w-3" /> Re-run Agent
          </button>
        )}

        {/* Thought Stream Timeline */}
        <ThoughtStream steps={thoughtSteps} />

        {/* Final Synthesized Report */}
        <ResultCard result={finalResult} isLoading={isAgentRunning} />

      </main>

      {/* Footer info */}
      <footer className="w-full text-center py-6 mt-8 border-t border-zinc-900 text-[10px] font-mono text-zinc-600">
        VoiceAgent · Orchestrated with Google Gemini 2.5 Flash
      </footer>

      {/* Settings Panel slide-out */}
      {showSettings && (
        <SettingsPanel
          apiKey={apiKey}
          onSave={handleSaveKey}
          onClear={handleClearKey}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Block Modal if no Key configured */}
      {showKeyModal && (
        <ApiKeyModal onSave={handleSaveKey} />
      )}
    </div>
  );
}

export default App;
