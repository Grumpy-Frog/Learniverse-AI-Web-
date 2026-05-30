import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content) return null;

  // Split content into blocks (paragraphs, list blocks, code blocks, headings)
  const blocks = content.split('\n\n');

  const renderTextWithInlineFormatting = (text: string) => {
    // Process **bold** and *italic*
    let parts: React.ReactNode[] = [text];

    // Bold formatting
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let tempParts: React.ReactNode[] = [];

    for (let part of parts) {
      if (typeof part !== 'string') {
        tempParts.push(part);
        continue;
      }

      let lastIndex = 0;
      const subParts: React.ReactNode[] = [];
      boldRegex.lastIndex = 0;

      while ((match = boldRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          subParts.push(part.substring(lastIndex, match.index));
        }
        subParts.push(
          <strong key={`b-${match.index}`} className="font-extrabold text-slate-900 dark:text-white">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < part.length) {
        subParts.push(part.substring(lastIndex));
      }
      tempParts.push(...subParts);
    }
    parts = tempParts;

    // Italic formatting *italic*
    tempParts = [];
    const italicRegex = /\*(.*?)\*/g;
    for (let part of parts) {
      if (typeof part !== 'string') {
        tempParts.push(part);
        continue;
      }

      let lastIndex = 0;
      const subParts: React.ReactNode[] = [];
      italicRegex.lastIndex = 0;

      while ((match = italicRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          subParts.push(part.substring(lastIndex, match.index));
        }
        subParts.push(
          <em key={`i-${match.index}`} className="italic text-slate-800 dark:text-slate-200">
            {match[1]}
          </em>
        );
        lastIndex = italicRegex.lastIndex;
      }

      if (lastIndex < part.length) {
        subParts.push(part.substring(lastIndex));
      }
      tempParts.push(...subParts);
    }
    parts = tempParts;

    // Inline standard code `code`
    tempParts = [];
    const inlineCodeRegex = /`(.*?)`/g;
    for (let part of parts) {
      if (typeof part !== 'string') {
        tempParts.push(part);
        continue;
      }

      let lastIndex = 0;
      const subParts: React.ReactNode[] = [];
      inlineCodeRegex.lastIndex = 0;

      while ((match = inlineCodeRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          subParts.push(part.substring(lastIndex, match.index));
        }
        subParts.push(
          <code key={`c-${match.index}`} className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-rose-500 dark:text-rose-400 font-semibold text-xs font-mono">
            {match[1]}
          </code>
        );
        lastIndex = inlineCodeRegex.lastIndex;
      }

      if (lastIndex < part.length) {
        subParts.push(part.substring(lastIndex));
      }
      tempParts.push(...subParts);
    }

    return tempParts.length > 0 ? tempParts : text;
  };

  return (
    <div className={`space-y-4 text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Code block (starts/ends with ```)
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const lastLine = lines[lines.length - 1];
          const codeLines = lastLine?.trim() === '```' ? lines.slice(1, -1) : lines.slice(1);
          return (
            <pre key={index} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">
              <code>{codeLines.join('\n')}</code>
            </pre>
          );
        }

        // Headings (# Heading)
        if (trimmed.startsWith('#')) {
          const level = (trimmed.match(/^#+/) || ['#'])[0].length;
          const text = trimmed.replace(/^#+\s*/, '');
          const formatted = renderTextWithInlineFormatting(text);
          const baseStyle = "heading-font font-black tracking-tight text-slate-900 dark:text-white leading-tight mt-6 mb-2";

          switch (level) {
            case 1:
              return <h1 key={index} className={`text-2xl md:text-3xl ${baseStyle}`}>{formatted}</h1>;
            case 2:
              return <h2 key={index} className={`text-xl md:text-2xl border-l-4 border-blue-600 dark:border-blue-400 pl-3 ${baseStyle}`}>{formatted}</h2>;
            case 3:
              return <h3 key={index} className={`text-lg md:text-xl ${baseStyle}`}>{formatted}</h3>;
            default:
              return <h4 key={index} className={`text-base md:text-lg ${baseStyle}`}>{formatted}</h4>;
          }
        }

        // Blockquotes (starts with >)
        if (trimmed.startsWith('>')) {
          const text = trimmed.replace(/^>\s*/, '');
          return (
            <blockquote key={index} className="pl-4 border-l-4 border-amber-500 dark:border-amber-400/60 py-1 my-2 bg-amber-500/5 text-slate-700 dark:text-slate-300 italic rounded-r-lg text-sm">
              {renderTextWithInlineFormatting(text)}
            </blockquote>
          );
        }

        // Unordered lists (starts with - or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n');
          return (
            <ul key={index} className="list-disc list-inside pl-4 space-y-1.5 my-2">
              {items.map((item, keyIdx) => {
                const itemText = item.replace(/^[-*]\s+/, '');
                return (
                  <li key={keyIdx} className="text-slate-700 dark:text-slate-350">
                    {renderTextWithInlineFormatting(itemText)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Ordered lists (starts with number like 1., 2.)
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split('\n');
          return (
            <ol key={index} className="list-decimal list-inside pl-4 space-y-1.5 my-2">
              {items.map((item, keyIdx) => {
                const itemText = item.replace(/^\d+\.\s+/, '');
                return (
                  <li key={keyIdx} className="text-slate-700 dark:text-slate-350">
                    {renderTextWithInlineFormatting(itemText)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // Default: Paragraph
        // Render simple inline formatted paragraph. If it includes single newlines, we can substitute them with linebreaks.
        const lines = trimmed.split('\n');
        return (
          <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                {renderTextWithInlineFormatting(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
