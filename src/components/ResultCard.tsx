import React, { useState } from 'react';
import { Copy, Check, FileCheck } from 'lucide-react';

interface ResultCardProps {
  result: string | null;
  isLoading: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe inline formatter for links, bold text, code blocks, list bullets, etc.
  const formatContent = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // 1. Code blocks (we look for simple fences)
      if (line.startsWith('```')) {
        return null; // Skip markdown delimiters for simplicity in inline render
      }

      // 2. Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={lineIdx} className="text-sm font-bold text-zinc-100 mt-4 mb-2 uppercase tracking-wide border-b border-zinc-900 pb-1">
            {parseInlineStyles(line.replace('### ', ''))}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={lineIdx} className="text-base font-bold text-zinc-100 mt-5 mb-2.5 uppercase tracking-wide border-b border-zinc-800 pb-1">
            {parseInlineStyles(line.replace('## ', ''))}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={lineIdx} className="text-lg font-bold text-zinc-100 mt-6 mb-3 uppercase tracking-wider border-b border-zinc-700 pb-1.5">
            {parseInlineStyles(line.replace('# ', ''))}
          </h2>
        );
      }

      // 3. Bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().replace(/^[-*]\s+/, '');
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs text-zinc-300 mb-1.5 leading-relaxed">
            {parseInlineStyles(content)}
          </li>
        );
      }

      // 4. Numbered lists
      const numberListRegex = /^(\d+)\.\s+/;
      if (numberListRegex.test(line.trim())) {
        const content = line.trim().replace(numberListRegex, '');
        return (
          <li key={lineIdx} className="ml-4 list-decimal text-xs text-zinc-300 mb-1.5 leading-relaxed">
            {parseInlineStyles(content)}
          </li>
        );
      }

      // 5. Default paragraphs
      if (line.trim() === '') {
        return <div key={lineIdx} className="h-2" />;
      }

      return (
        <p key={lineIdx} className="text-xs text-zinc-300 mb-2 leading-relaxed">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  // Helper to parse bolding **text** and links [label](url)
  const parseInlineStyles = (text: string) => {
    // Basic regex matching for links and bold text
    const parts = [];
    let currentIdx = 0;
    
    // We scan character by character to handle bolding and links simply
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    
    let match: RegExpExecArray | null;
    const items: { start: number; end: number; type: 'link' | 'bold'; text: string; extra?: string }[] = [];

    // Collect all matches
    while ((match = linkRegex.exec(text)) !== null) {
      items.push({
        start: match.index,
        end: linkRegex.lastIndex,
        type: 'link',
        text: match[1],
        extra: match[2]
      });
    }

    // Reset lastIndex for bold
    boldRegex.lastIndex = 0;
    while ((match = boldRegex.exec(text)) !== null) {
      const currentMatch = match;
      // Check if it overlaps with a link match
      const overlaps = items.some(item => 
        (currentMatch.index >= item.start && currentMatch.index < item.end) ||
        (boldRegex.lastIndex > item.start && boldRegex.lastIndex <= item.end)
      );
      if (!overlaps) {
        items.push({
          start: currentMatch.index,
          end: boldRegex.lastIndex,
          type: 'bold',
          text: currentMatch[1]
        });
      }
    }

    // Sort items by start index
    items.sort((a, b) => a.start - b.start);

    // Build the rendered parts
    for (const item of items) {
      if (item.start > currentIdx) {
        parts.push(text.substring(currentIdx, item.start));
      }
      
      if (item.type === 'link') {
        parts.push(
          <a
            key={item.start}
            href={item.extra}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline font-mono break-all inline-flex items-center gap-0.5"
          >
            {item.text}
          </a>
        );
      } else if (item.type === 'bold') {
        parts.push(
          <strong key={item.start} className="text-zinc-100 font-bold">
            {item.text}
          </strong>
        );
      }
      
      currentIdx = item.end;
    }

    if (currentIdx < text.length) {
      parts.push(text.substring(currentIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  if (!result && !isLoading) return null;

  return (
    <div className="w-full max-w-xl mx-auto border border-zinc-900 bg-zinc-950/40 rounded-lg p-5 font-mono shadow-xl relative overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-zinc-400" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Final Report / Output</span>
        </div>
        {result && !isLoading && (
          <button
            onClick={handleCopy}
            className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors text-[9px] border border-zinc-900 px-2 py-0.5 rounded bg-zinc-950"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy Output
              </>
            )}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin"></div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse">
            Agent generating response...
          </span>
        </div>
      ) : (
        <div className="select-text whitespace-pre-wrap text-left max-w-full overflow-x-auto text-zinc-300">
          {formatContent(result || '')}
        </div>
      )}
    </div>
  );
};
