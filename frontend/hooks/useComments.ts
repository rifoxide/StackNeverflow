'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { commentsApi, reactionsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Comment,
  CreateCommentDto,
  ReactionType,
} from '@/lib/types';

interface UseCommentsResult {
  /** Flat list of all comments on the post. */
  comments: Comment[];
  /** Map of commentId → current user's reaction (or null). */
  userReactions: Record<string, ReactionType | null>;
  /** Id of the comment currently being replied to, or null. */
  replyingTo: string | null;
  /** True while the initial fetch is in flight. */
  isLoading: boolean;
  /** True while a comment is being submitted. */
  isSubmitting: boolean;
  /** Error message from the last failed operation, or empty string. */
  error: string;
  /** Submit a new top-level comment or reply. */
  addComment: (body: string, parentCommentId?: string) => Promise<Comment | null>;
  /** Toggle the current user's like/dislike on a comment. */
  toggleReaction: (commentId: string, type: ReactionType) => Promise<void>;
  /** Open/close the inline reply form under a comment. */
  setReplyingTo: (id: string | null) => void;
  /** Re-fetch comments and reactions. Exposed so the list can wire a Retry button. */
  refresh: () => Promise<void>;
}

/**
 * Owns all state for a post's comments section.
 *
 * Single source of truth so the section, list, items, and reaction
 * buttons don't have to prop-drill reaction state or comment lists
 * between each other.
 */
export function useComments(postId: string): UseCommentsResult {
  const { isAuthenticated } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [userReactions, setUserReactions] = useState<
    Record<string, ReactionType | null>
  >({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const list = await commentsApi.getByPost(postId);
      setComments(list);

      if (isAuthenticated && list.length > 0) {
        const ids = list.map((c) => c.id);
        try {
          const reactions = await reactionsApi.getMineBatch('comment', ids);
          setUserReactions(reactions);
        } catch {
          // Non-fatal: if the batch fails, the UI just shows no active reactions.
          setUserReactions({});
        }
      } else {
        setUserReactions({});
      }
    } catch (err) {
      const axiosErr = err as AxiosError;
      setError(
        axiosErr?.response?.status === 404
          ? 'Post not found'
          : 'Failed to load comments',
      );
    } finally {
      setIsLoading(false);
    }
  }, [postId, isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addComment = useCallback(
    async (body: string, parentCommentId?: string): Promise<Comment | null> => {
      if (!body.trim()) return null;
      setIsSubmitting(true);
      try {
        const dto: CreateCommentDto = {
          body: body.trim(),
          parentCommentId,
        };
        const created = await commentsApi.create(postId, dto);
        setComments((prev) => [...prev, created]);
        // Newly posted comments start with no reaction from this user.
        setUserReactions((prev) => ({ ...prev, [created.id]: null }));
        return created;
      } catch (err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const message =
          (axiosErr?.response?.data as { message?: string } | undefined)?.message;
        setError(message ?? 'Failed to post comment');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [postId],
  );

  const toggleReaction = useCallback(
    async (commentId: string, type: ReactionType) => {
      if (!isAuthenticated) return;

      // Snapshot for rollback on error.
      const prevReaction = userReactions[commentId] ?? null;
      const target = comments.find((c) => c.id === commentId);
      if (!target) return;
      const prevLikes = target.likesCount;
      const prevDislikes = target.dislikesCount;

      // Compute next state.
      const nextReaction: ReactionType | null =
        prevReaction === type ? null : type;
      const nextLikes =
        prevLikes + (type === 'like' ? 1 : 0) - (prevReaction === 'like' ? 1 : 0);
      const nextDislikes =
        prevDislikes +
        (type === 'dislike' ? 1 : 0) -
        (prevReaction === 'dislike' ? 1 : 0);

      // Apply optimistically.
      setUserReactions((prev) => ({ ...prev, [commentId]: nextReaction }));
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likesCount: nextLikes, dislikesCount: nextDislikes }
            : c,
        ),
      );

      try {
        await reactionsApi.toggle({
          targetType: 'comment',
          targetId: commentId,
          type,
        });
      } catch {
        // Roll back.
        setUserReactions((prev) => ({ ...prev, [commentId]: prevReaction }));
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likesCount: prevLikes,
                  dislikesCount: prevDislikes,
                }
              : c,
          ),
        );
      }
    },
    [comments, isAuthenticated, userReactions],
  );

  return {
    comments,
    userReactions,
    replyingTo,
    isLoading,
    isSubmitting,
    error,
    addComment,
    toggleReaction,
    setReplyingTo,
    refresh,
  };
}
