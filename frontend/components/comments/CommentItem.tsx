'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@heroui/react/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/comments';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { CommentReactionButtons } from './CommentReactionButtons';
import { CommentForm } from './CommentForm';
import type { Comment, ReactionType } from '@/lib/types';

interface CommentItemProps {
  comment: Comment;
  /** Direct replies to this comment. */
  childrenComments: Comment[];
  /** All comments bucketed by parent id (top-level under `null`). */
  commentsByParent: Map<string | null, Comment[]>;
  /** Lookup the current user's reaction on a given comment id. */
  getUserReaction: (commentId: string) => ReactionType | null;
  /** The id currently being replied to, or null. */
  replyingTo: string | null;
  /** Whether a comment is currently being submitted. */
  isSubmitting: boolean;
  /** Reaction toggle handler. */
  onToggleReaction: (commentId: string, type: ReactionType) => void;
  /** Open/close the reply form for a given parent id. */
  onSetReplyingTo: (id: string | null) => void;
  /** Reply submit handler. */
  onAddComment: (body: string, parentCommentId?: string) => Promise<Comment | null>;
  /** Current nesting depth. Top-level = 0. */
  depth: number;
}

/**
 * Past MAX_INDENT_DEPTH we stop adding left margin so the gutter
 * doesn't disappear off the viewport on mobile.
 */
const MAX_INDENT_DEPTH = 3;

export function CommentItem({
  comment,
  childrenComments,
  commentsByParent,
  getUserReaction,
  replyingTo,
  isSubmitting,
  onToggleReaction,
  onSetReplyingTo,
  onAddComment,
  depth,
}: CommentItemProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const isAuthor = currentUser?.id === comment.authorId;
  const showReplyForm = replyingTo === comment.id;

  const submitReply = async (body: string) => {
    const created = await onAddComment(body, comment.id);
    const ok = created !== null;
    if (ok) onSetReplyingTo(null);
    return ok;
  };

  // Depth-based indent (margin/padding)
  const indentClass = cn(
    depth === 0
      ? ''
      : depth < MAX_INDENT_DEPTH
        ? cn('ml-4 md:ml-8', depth >= 2 && 'ml-6 md:ml-12')
        : 'pl-4',
  );

  return (
    <div className={cn('pt-3', depth > 0 && 'mt-3')}>
      <div className={indentClass}>
        <div className="flex items-start gap-2.5">
          <Link
            href={`/developers/${comment.author.id}`}
            className="flex-shrink-0"
            aria-label={`View ${comment.author.name}'s profile`}
          >
            <Avatar className="h-8 w-8 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <Link
                href={`/developers/${comment.author.id}`}
                className="font-medium text-gray-900 dark:text-gray-100 hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
              >
                {comment.author.name}
              </Link>
              {isAuthor && (
                <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#2D88FF]/20 dark:text-[#2D88FF]">
                  You
                </span>
              )}
              <span className="text-gray-500 dark:text-gray-500 text-xs">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            <div className="mt-1.5">
              <MarkdownViewer
                content={comment.body}
                className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              />
            </div>

            <div className="mt-2">
              <CommentReactionButtons
                likesCount={comment.likesCount}
                dislikesCount={comment.dislikesCount}
                userReaction={getUserReaction(comment.id)}
                onToggle={(type) => onToggleReaction(comment.id, type)}
                showReply={isAuthenticated}
                onReply={() => onSetReplyingTo(showReplyForm ? null : comment.id)}
                replyLabel={showReplyForm ? 'Cancel' : 'Reply'}
              />
            </div>

            {showReplyForm && (
              <div className="mt-3">
                <CommentForm
                  onSubmit={submitReply}
                  isSubmitting={isSubmitting}
                  placeholder="Write a reply…"
                  autoFocus
                  replyingToName={comment.author.name}
                  onCancel={() => onSetReplyingTo(null)}
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {childrenComments.length > 0 && (
        <div>
          {childrenComments.map((child) => {
            const grandchildren = commentsByParent.get(child.id) ?? [];
            return (
              <CommentItem
                key={child.id}
                comment={child}
                childrenComments={grandchildren}
                commentsByParent={commentsByParent}
                getUserReaction={getUserReaction}
                replyingTo={replyingTo}
                isSubmitting={isSubmitting}
                onToggleReaction={onToggleReaction}
                onSetReplyingTo={onSetReplyingTo}
                onAddComment={onAddComment}
                depth={depth + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
