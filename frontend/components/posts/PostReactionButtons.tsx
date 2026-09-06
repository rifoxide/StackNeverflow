'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@heroui/react/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { reactionsApi } from '@/lib/api';
import type { ReactionType } from '@/lib/types';

interface PostReactionButtonsProps {
  postId: string;
  initialLikesCount: number;
  initialDislikesCount: number;
  /** Current user's reaction on this post, or null. */
  initialUserReaction: ReactionType | null;
  /** Callback after successful reaction toggle. */
  onReactionChange?: (newCounts: { likesCount: number; dislikesCount: number }) => void;
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
  initialUserReaction,
  onReactionChange,
  size = 'md',
}: PostReactionButtonsProps) {
  const { isAuthenticated } = useAuth();
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [dislikesCount, setDislikesCount] = useState(initialDislikesCount);
  const [isToggling, setIsToggling] = useState(false);

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

  const sizeClass = size === 'sm' ? 'h-8 px-2 text-xs' : 'h-10 px-3 text-sm';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="secondary"
        size={size}
        aria-label={isAuthenticated ? 'Like' : 'Like (log in to react)'}
        isDisabled={!isAuthenticated || isToggling}
        onClick={() => handleToggle('like')}
        className={cn(
          sizeClass,
          'gap-1.5',
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

      <Button
        type="button"
        variant="secondary"
        size={size}
        aria-label={isAuthenticated ? 'Dislike' : 'Dislike (log in to react)'}
        isDisabled={!isAuthenticated || isToggling}
        onClick={() => handleToggle('dislike')}
        className={cn(
          sizeClass,
          'gap-1.5',
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
  );
}
