'use client';

import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/hooks/useComments';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import type { Comment } from '@/lib/types';

interface CommentSectionProps {
  postId: string;
  /**
   * Called after a top-level comment is successfully created so the
   * host page can bump its denormalized post.commentCount without
   * refetching the post.
   */
  onCommentCreated?: (comment: Comment) => void;
}

export function CommentSection({
  postId,
  onCommentCreated,
}: CommentSectionProps) {
  const {
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
  } = useComments(postId);

  const { isAuthenticated } = useAuth();

  const topLevelCount = comments.filter((c) => c.parentCommentId === null).length;

  const handleAddTopLevel = async (body: string) => {
    const created = await addComment(body);
    if (created && created.parentCommentId === null) {
      onCommentCreated?.(created);
    }
    return created !== null;
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {topLevelCount} {topLevelCount === 1 ? 'Comment' : 'Comments'}
        </h2>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top-level form / login prompt */}
        {isAuthenticated ? (
          <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
            <CommentForm
              onSubmit={handleAddTopLevel}
              isSubmitting={isSubmitting}
              placeholder="Write a comment…"
              rows={3}
            />
          </div>
        ) : (
          <div className="pb-4 border-b border-gray-200 dark:border-gray-800 text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Log in to join the discussion.
            </p>
            <Link
              href={`/auth/login?redirect=/posts/${postId}`}
              className="text-sm font-medium text-[#1877F2] dark:text-[#2D88FF] hover:underline"
            >
              Log in to comment →
            </Link>
          </div>
        )}

        <CommentList
          comments={comments}
          isLoading={isLoading}
          error={error}
          userReactions={userReactions}
          replyingTo={replyingTo}
          isSubmitting={isSubmitting}
          onToggleReaction={toggleReaction}
          onSetReplyingTo={setReplyingTo}
          onAddComment={addComment}
          onRetry={refresh}
        />
      </CardContent>
    </Card>
  );
}
