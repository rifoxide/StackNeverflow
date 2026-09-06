'use client';

import { ThumbsUp, ThumbsDown, Reply } from 'lucide-react';
import { Button } from '@heroui/react/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactionType } from '@/lib/types';

interface CommentReactionButtonsProps {
  likesCount: number;
  dislikesCount: number;
  /** Current user's reaction on this comment, or null. */
  userReaction: ReactionType | null;
  /** Toggle handler. No-op for anonymous users. */
  onToggle: (type: ReactionType) => void;
  /** Reply button props */
  showReply?: boolean;
  onReply?: () => void;
  replyLabel?: string;
  /** Size variant — sm matches the inline comment row. */
  size?: 'sm' | 'md';
}

/**
 * Like / dislike / reply toolbar for a single comment.
 *
 * Grouped in a rounded container matching the post reaction buttons style.
 */
export function CommentReactionButtons({
  likesCount,
  dislikesCount,
  userReaction,
  onToggle,
  showReply = false,
  onReply,
  replyLabel = 'Reply',
  size = 'sm',
}: CommentReactionButtonsProps) {
  const { isAuthenticated } = useAuth();

  const handle = (type: ReactionType) => {
    if (!isAuthenticated) return;
    onToggle(type);
  };

  const sizeClass = size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3 text-sm';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="inline-flex items-center gap-0 bg-gray-100 dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/60 rounded-lg overflow-hidden">
      {/* Like/Dislike Group */}
      <div className="inline-flex items-center">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={isAuthenticated ? 'Like' : 'Like (log in to react)'}
          isDisabled={!isAuthenticated}
          onClick={() => handle('like')}
          className={cn(
            sizeClass,
            'gap-1.5 rounded-none border-0 bg-transparent hover:bg-gray-200/60 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300 transition-colors',
          )}
        >
          <ThumbsUp
            className={cn(
              iconSize,
              userReaction === 'like'
                ? 'text-[#1877F2] dark:text-[#2D88FF] fill-current'
                : 'text-gray-500 dark:text-gray-400',
            )}
          />
          <span>{likesCount}</span>
        </Button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" aria-hidden="true" />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={isAuthenticated ? 'Dislike' : 'Dislike (log in to react)'}
          isDisabled={!isAuthenticated}
          onClick={() => handle('dislike')}
          className={cn(
            sizeClass,
            'gap-1.5 rounded-none border-0 bg-transparent hover:bg-gray-200/60 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300 transition-colors',
          )}
        >
          <ThumbsDown
            className={cn(
              iconSize,
              userReaction === 'dislike'
                ? 'text-red-600 dark:text-red-400 fill-current'
                : 'text-gray-500 dark:text-gray-400',
            )}
          />
          <span>{dislikesCount}</span>
        </Button>
      </div>

      {/* Reply Group */}
      {showReply && (
        <>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" aria-hidden="true" role="separator" />
          <div className="inline-flex items-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onReply}
              className={cn(
                sizeClass,
                'gap-1.5 rounded-none border-0 bg-transparent hover:bg-gray-200/60 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300 transition-colors',
              )}
              aria-label={replyLabel}
            >
              <Reply className={iconSize} />
              <span>{replyLabel}</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
