'use client';

import { Skeleton } from '@heroui/react/skeleton';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@heroui/react/button';
import { Card, CardContent } from '@heroui/react/card';
import { groupCommentsByParent } from '@/lib/comments';
import { CommentItem } from './CommentItem';
import type { Comment, ReactionType } from '@/lib/types';

interface CommentListProps {
  comments: Comment[];
  isLoading: boolean;
  error: string;
  userReactions: Record<string, ReactionType | null>;
  replyingTo: string | null;
  isSubmitting: boolean;
  onToggleReaction: (commentId: string, type: ReactionType) => void;
  onSetReplyingTo: (id: string | null) => void;
  onAddComment: (body: string, parentCommentId?: string) => Promise<Comment | null>;
  onRetry: () => void;
}

export function CommentList({
  comments,
  isLoading,
  error,
  userReactions,
  replyingTo,
  isSubmitting,
  onToggleReaction,
  onSetReplyingTo,
  onAddComment,
  onRetry,
}: CommentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading comments">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
              <Skeleton className="h-3 w-4/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
        <CardContent className="text-center py-8">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-900 dark:text-red-300 mb-3">
            {error}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRetry}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  const byParent = groupCommentsByParent(comments);
  const topLevel = byParent.get(null) ?? [];

  const getUserReaction = (commentId: string): ReactionType | null =>
    userReactions[commentId] ?? null;

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {topLevel.map((comment) => {
        const children = byParent.get(comment.id) ?? [];
        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            childrenComments={children}
            commentsByParent={byParent}
            getUserReaction={getUserReaction}
            replyingTo={replyingTo}
            isSubmitting={isSubmitting}
            onToggleReaction={onToggleReaction}
            onSetReplyingTo={onSetReplyingTo}
            onAddComment={onAddComment}
            depth={0}
          />
        );
      })}
    </div>
  );
}
