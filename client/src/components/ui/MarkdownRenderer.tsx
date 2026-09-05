import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Parses and formats inline markdown styles: **bold**, *italic*, `code`
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex splitting by bold (**...** or __...__), code (`...`), italic (*...*)
  const tokens: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(pattern);

  parts.forEach((part, index) => {
    if (!part) return;

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const clean = part.slice(2, -2);
      tokens.push(
        <strong key={index} style={{ fontWeight: 700, color: 'inherit' }}>
          {clean}
        </strong>
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      const clean = part.slice(1, -1);
      tokens.push(
        <code
          key={index}
          style={{
            background: 'rgba(84, 72, 248, 0.08)',
            color: '#5448F8',
            padding: '2px 6px',
            borderRadius: '5px',
            fontSize: '12.5px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }}
        >
          {clean}
        </code>
      );
    } else if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      const clean = part.slice(1, -1);
      tokens.push(
        <em key={index} style={{ fontStyle: 'italic' }}>
          {clean}
        </em>
      );
    } else {
      tokens.push(part);
    }
  });

  return tokens;
}

/**
 * Production-grade Markdown & Rich Text Renderer for StudyPal AI responses.
 * Eliminates all raw asterisks, hash headers, and formatting artifacts.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', style = {} }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = (key: string) => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul
            key={key}
            style={{
              paddingLeft: '20px',
              margin: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              listStyleType: 'disc'
            }}
          >
            {currentList.items.map((item, i) => (
              <li key={i} style={{ lineHeight: 1.55 }}>
                {item}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol
            key={key}
            style={{
              paddingLeft: '22px',
              margin: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              listStyleType: 'decimal'
            }}
          >
            {currentList.items.map((item, i) => (
              <li key={i} style={{ lineHeight: 1.55 }}>
                {item}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(`flush-gap-${idx}`);
      return;
    }

    // Heading 3 or 4 (### or ####)
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      flushList(`flush-h3-${idx}`);
      const headingText = line.replace(/^#{3,4}\s+/, '');
      elements.push(
        <h4
          key={`h3-${idx}`}
          style={{
            fontSize: '15.5px',
            fontWeight: 800,
            color: '#0F172A',
            marginTop: idx === 0 ? '0' : '14px',
            marginBottom: '6px',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {parseInlineMarkdown(headingText)}
        </h4>
      );
      return;
    }

    // Heading 1 or 2 (# or ##)
    if (line.startsWith('# ') || line.startsWith('## ')) {
      flushList(`flush-h2-${idx}`);
      const headingText = line.replace(/^#{1,2}\s+/, '');
      elements.push(
        <h3
          key={`h2-${idx}`}
          style={{
            fontSize: '17px',
            fontWeight: 800,
            color: '#0F172A',
            marginTop: idx === 0 ? '0' : '16px',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}
        >
          {parseInlineMarkdown(headingText)}
        </h3>
      );
      return;
    }

    // Unordered list items (* or - or •)
    if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
      const itemContent = line.replace(/^[*•-]\s+/, '');
      if (!currentList || currentList.type !== 'ul') {
        flushList(`flush-pre-ul-${idx}`);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(parseInlineMarkdown(itemContent));
      return;
    }

    // Ordered list items (1. , 2. , etc.)
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const itemContent = orderedMatch[2];
      if (!currentList || currentList.type !== 'ol') {
        flushList(`flush-pre-ol-${idx}`);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(parseInlineMarkdown(itemContent));
      return;
    }

    // Callout / blockquote (> )
    if (line.startsWith('> ')) {
      flushList(`flush-quote-${idx}`);
      const quoteText = line.replace(/^>\s*/, '');
      elements.push(
        <div
          key={`quote-${idx}`}
          style={{
            margin: '10px 0',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#F0EEFE',
            borderLeft: '4px solid #5448F8',
            fontSize: '13.5px',
            color: '#334155'
          }}
        >
          {parseInlineMarkdown(quoteText)}
        </div>
      );
      return;
    }

    // Standard Paragraph
    flushList(`flush-p-${idx}`);
    elements.push(
      <p
        key={`p-${idx}`}
        style={{
          margin: '6px 0',
          lineHeight: 1.6,
          fontSize: '14px',
          color: 'inherit'
        }}
      >
        {parseInlineMarkdown(line)}
      </p>
    );
  });

  flushList('flush-final');

  return (
    <div className={className} style={{ width: '100%', ...style }}>
      {elements}
    </div>
  );
};
