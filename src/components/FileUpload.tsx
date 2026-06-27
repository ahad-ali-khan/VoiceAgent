import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';

interface FileUploadProps {
  fileName: string | null;
  onFileLoaded: (name: string, content: string) => void;
  onClearFile: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  fileName,
  onFileLoaded,
  onClearFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    
    // Check file size (limit to ~2MB for simple text reading and API limits)
    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large. Limit is 2MB for analysis.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        onFileLoaded(file.name, text);
      } else {
        setError('Could not parse file content as text.');
      }
    };
    reader.onerror = () => {
      setError('Error reading file.');
    };
    
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      {fileName ? (
        <div className="flex items-center justify-between rounded border border-emerald-950/60 bg-emerald-950/20 p-4 font-mono">
          <div className="flex items-center gap-3">
            <div className="rounded bg-emerald-950/40 p-2 text-emerald-400 border border-emerald-900/40">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100 uppercase tracking-wide">File Uploaded</p>
              <p className="text-[10px] text-zinc-400 break-all">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClearFile}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors border border-zinc-900"
            title="Remove File"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded border border-dashed p-6 text-center cursor-pointer transition-all font-mono ${
            dragActive
              ? 'border-zinc-400 bg-zinc-900/60 text-zinc-200'
              : 'border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleChange}
            accept=".txt,.json,.csv,.md,.js,.ts,.tsx,.jsx,.html,.css"
            className="hidden"
          />
          <Upload className="h-8 w-8 mb-2 text-zinc-600" />
          <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            Drag & drop document here
          </p>
          <p className="text-[10px] text-zinc-500">
            or click to browse (.txt, .md, .json, .csv, etc.)
          </p>
          {error && (
            <div className="flex items-center gap-1.5 mt-3 text-red-400 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
