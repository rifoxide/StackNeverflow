'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { TextArea } from '@heroui/react/textarea';
import { Button } from '@heroui/react/button';
import { Send, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  /** Submit handler. Return true to clear the textarea, false to keep it. */
  onSubmit: (body: string) => Promise<boolean>;
  /** Disable submit + show spinner (e.g. while a request is in flight). */
  isSubmitting?: boolean;
  /** Placeholder text. Defaults to "Write a comment…". */
  placeholder?: string;
  /** Auto-focus on mount (used for inline reply forms). */
  autoFocus?: boolean;
  /** Optional "Replying to <name>" header label. */
  replyingToName?: string;
  /** Optional cancel button to close an inline reply form. */
  onCancel?: () => void;
  /** Initial rows for the textarea. */
  rows?: number;
  /** Extra classes for the outer wrapper. */
  className?: string;
}

/**
 * Plain-text comment form. Used for both top-level comments and
 * inline replies.
 *
 * Submits on Cmd/Ctrl+Enter. Body is trimmed before submit; empty
 * bodies are rejected client-side and disable the submit button.
 */
export function CommentForm({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Write a comment…',
  autoFocus = false,
  replyingToName,
  onCancel,
  rows = 3,
  className,
}: CommentFormProps) {
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus) {
      // Defer so HeroUI's own focus management doesn't fight us.
      const t = setTimeout(() => textareaRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;

  const submit = async () => {
    if (!canSubmit) return;
    const ok = await onSubmit(trimmed);
    if (ok) {
      setBody('');
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {replyingToName && (
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            Replying to <span className="font-medium">{replyingToName}</span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              aria-label="Cancel reply"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
        </div>
      )}

      <TextArea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={isSubmitting}
        aria-label={replyingToName ? `Reply to ${replyingToName}` : 'Write a comment'}
        className="text-sm bg-gray-100 dark:bg-gray-800 w-full"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[10px] font-mono">
            {typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
              ? '⌘'
              : 'Ctrl'}
          </kbd>
          <span className="ml-1.5">+ Enter to submit</span>
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          isDisabled={!canSubmit}
          onClick={submit}
          className="gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {replyingToName ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </div>
  );
}
