'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@heroui/react/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { reactionsApi } from '@/lib/api';
import type { ReactionType } from '@/lib/types';

interface PostReactionButtonsProps {
  postId: string;
  initialLikesCount: number;
  initialDislikesCount: number;
  commentCount?: number;
  /** Current user's reaction on this post, or null. */
  initialUserReaction: ReactionType | null;
  /** Callback after successful reaction toggle. */
  onReactionChange?: (newCounts: { likesCount: number; dislikesCount: number }) => void;
  /** Callback when comment button is clicked */
  onCommentClick?: () => void;
  /** Size variant — md for detail page, sm for feed. */
  size?: 'sm' | 'md';
}

/**
 * Like / dislike pair for a single post with optimistic updates.
 *
 * Handles the toggle semantics:
 * - Clicking the same reaction removes it
 * - Clicking the opposite reaction switches it
 * - Updates counts optimistically for instant feedback
 * - Reverts on API failure
 */
export function PostReactionButtons({
  postId,
  initialLikesCount,
  initialDislikesCount,
  commentCount = 0,
  initialUserReaction,
  onReactionChange,
  onCommentClick,
  size = 'md',
}: PostReactionButtonsProps) {
  const { isAuthenticated } = useAuth();
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [dislikesCount, setDislikesCount] = useState(initialDislikesCount);
  const [isToggling, setIsToggling] = useState(false);

  // Sync state when initial props change (e.g., when user reaction is fetched)
  useEffect(() => {
    setUserReaction(initialUserReaction);
  }, [initialUserReaction]);

  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  useEffect(() => {
    setDislikesCount(initialDislikesCount);
  }, [initialDislikesCount]);

  const handleToggle = async (type: ReactionType) => {
    if (!isAuthenticated || isToggling) return;

    // Optimistic update
    const previousReaction = userReaction;
    const previousLikes = likesCount;
    const previousDislikes = dislikesCount;

    let newLikes = likesCount;
    let newDislikes = dislikesCount;
    let newReaction: ReactionType | null = null;

    if (previousReaction === type) {
      // Remove reaction
      if (type === 'like') {
        newLikes -= 1;
      } else {
        newDislikes -= 1;
      }
      newReaction = null;
    } else if (previousReaction === null) {
      // Add new reaction
      if (type === 'like') {
        newLikes += 1;
      } else {
        newDislikes += 1;
      }
      newReaction = type;
    } else {
      // Switch reaction
      if (previousReaction === 'like') {
        newLikes -= 1;
        newDislikes += 1;
      } else {
        newDislikes -= 1;
        newLikes += 1;
      }
      newReaction = type;
    }

    setUserReaction(newReaction);
    setLikesCount(newLikes);
    setDislikesCount(newDislikes);

    try {
      setIsToggling(true);
      await reactionsApi.toggle({
        targetType: 'post',
        targetId: postId,
        type,
      });

      // Notify parent of successful change
      onReactionChange?.({ likesCount: newLikes, dislikesCount: newDislikes });
    } catch (error) {
      // Revert optimistic update on failure
      setUserReaction(previousReaction);
      setLikesCount(previousLikes);
      setDislikesCount(previousDislikes);
      console.error('Failed to toggle reaction:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const sizeClass = size === 'sm' ? 'h-9 px-3 text-xs font-medium' : 'h-10 px-3.5 text-sm font-medium';
  const iconSize = size === 'sm' ? 'h-[18px] w-[18px]' : 'h-5 w-5';

  return (
    <div className="inline-flex items-center gap-0 bg-gray-200/80 dark:bg-gray-800/90 border border-gray-300/70 dark:border-gray-700/60 rounded-lg overflow-hidden w-fit shadow-xs">
      {/* Like/Dislike Group */}
      <div className="inline-flex items-center">
        <Button
          type="button"
          variant="secondary"
          size={size}
          aria-label={isAuthenticated ? 'Like' : 'Like (log in to react)'}
          isDisabled={!isAuthenticated || isToggling}
          onClick={() => handleToggle('like')}
          className={cn(
            sizeClass,
            'gap-1.5 rounded-none border-0 bg-transparent hover:bg-gray-300/60 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300 transition-colors',
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
          size={size}
          aria-label={isAuthenticated ? 'Dislike' : 'Dislike (log in to react)'}
          isDisabled={!isAuthenticated || isToggling}
          onClick={() => handleToggle('dislike')}
          className={cn(
            sizeClass,
            'gap-1.5 rounded-none border-0 bg-transparent hover:bg-gray-300/60 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300 transition-colors',
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

      {/* Separator */}
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" aria-hidden="true" role="separator" />

      {/* Comment Group */}
      <div className="inline-flex items-center">
        <Button
          type="button"
          variant="secondary"
          size={size}
          aria-label="Comments"
          onClick={onCommentClick}
          className={cn(
            sizeClass,
            'gap-1.5 rounded-none border-0 bg-transparent hover:bg-gray-300/60 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300 transition-colors',
          )}
        >
          <MessageSquare className={cn(iconSize, 'text-gray-500 dark:text-gray-400')} />
          <span>{commentCount}</span>
        </Button>
      </div>
    </div>
  );
}
