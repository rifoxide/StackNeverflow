'use client';

import { useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your post content here...',
  disabled = false,
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  const lineCount = value.split('\n').length;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-[500px]">
      {/* Editor - Left Side */}
      <div className="flex flex-col">
        <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Editor</div>
        <div className="textarea-glass flex-1 flex rounded-xl overflow-hidden shadow-xs transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500/60">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            className="flex flex-col overflow-hidden bg-black/5 dark:bg-white/5 text-gray-400 dark:text-gray-500 text-right pr-3 pl-2 py-2 font-mono text-sm select-none border-r border-gray-200/50 dark:border-gray-700/50"
            style={{ lineHeight: '1.5rem' }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} style={{ height: '1.5rem' }}>
                {i + 1}
              </div>
            ))}
          </div>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 resize-none font-mono text-sm p-2.5 bg-transparent border-0 outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            style={{ lineHeight: '1.5rem' }}
          />
        </div>
      </div>

      {/* Preview - Right Side */}
      <div className="flex flex-col">
        <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Preview</div>
        <div className="textarea-glass flex-1 overflow-y-auto rounded-xl p-4 shadow-xs">
          {value ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={isDark ? vscDarkPlus : oneLight}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.375rem',
                          border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">Nothing to preview yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
