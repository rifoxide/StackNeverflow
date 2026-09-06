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

  const sizeClass = size === 'sm' ? 'h-8 px-2 text-xs' : 'h-10 px-3 text-sm';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className="inline-flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
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
            'gap-1.5 rounded-none border-0',
            userReaction === 'like' &&
              'bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#2D88FF]/20 dark:text-[#2D88FF] hover:bg-[#1877F2]/20',
          )}
        >
          <ThumbsUp
            className={cn(
              iconSize,
              userReaction === 'like' && 'fill-current',
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
            'gap-1.5 rounded-none border-0',
            userReaction === 'dislike' &&
              'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-500/20',
          )}
        >
          <ThumbsDown
            className={cn(
              iconSize,
              userReaction === 'dislike' && 'fill-current',
            )}
          />
          <span>{dislikesCount}</span>
        </Button>
      </div>

      {/* Reply Group */}
      {showReply && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" aria-hidden="true" role="separator" />
          <div className="inline-flex items-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onReply}
              className={cn(sizeClass, 'gap-1.5 rounded-none border-0')}
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
