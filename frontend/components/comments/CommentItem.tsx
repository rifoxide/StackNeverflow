'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@heroui/react/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/comments';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { CommentReactionButtons } from './CommentReactionButtons';
import { CommentForm } from './CommentForm';
import type { Comment, ReactionType } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  /** Whether this is the last child in its siblings list. */
  isLast?: boolean;
}

// Connector geometry constants
const CURVE_HEIGHT = 26; // px, avatar vertical center from top of a row
const CURVE_WIDTH = 24; // px, horizontal reach of the horizontal line

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
  const hasReplies = childrenComments.length > 0;

  const submitReply = async (body: string) => {
    const created = await onAddComment(body, comment.id);
    const ok = created !== null;
    if (ok) onSetReplyingTo(null);
    return ok;
  };

  return (
    <div className="relative list-none">
      {/* Horizontal line from parent's guideline to this comment's avatar */}
      {depth > 0 && (
        <span
          className="absolute border-b-[2px] border-gray-200 dark:border-gray-700"
          style={{ left: -CURVE_WIDTH + 2, top: CURVE_HEIGHT, width: CURVE_WIDTH - 1, height: 0 }}
          aria-hidden="true"
        />
      )}

      <div className="flex gap-2.5 pt-3 pb-3">
        <Link
          href={`/developers/${comment.author.id}`}
          className="relative z-10 flex-shrink-0"
          aria-label={`View ${comment.author.name}'s profile`}
        >
          <Avatar className="h-8 w-8 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
            {comment.author.profilePicture ? (
              <AvatarImage src={`${API_URL}${comment.author.profilePicture}`} alt={comment.author.name} className="object-cover" />
            ) : (
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            )}
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

      {/* This node's own guideline, running from avatar center down through children */}
      {hasReplies && (
        <>
          {/* Vertical line starts from this comment's avatar center */}
          <span
            className="absolute w-[2px] bg-gray-200 dark:bg-gray-700"
            style={{
              left: 16, // Avatar center (16px = half of 32px avatar)
              top: CURVE_HEIGHT,
              bottom: 0
            }}
            aria-hidden="true"
          />
          <ul className="mt-1" style={{ marginLeft: 38 }}>
            {childrenComments.map((child, i) => {
              const grandchildren = commentsByParent.get(child.id) ?? [];
              const isLastChild = i === childrenComments.length - 1;
              return (
                <li key={child.id} className="relative" style={{ paddingBottom: isLastChild ? 0 : undefined }}>
                  {/* Mask for last child to stop parent's vertical line */}
                  {isLastChild && (
                    <span
                      className="comment-line-mask absolute w-[3px]"
                      style={{
                        left: -22,
                        top: CURVE_HEIGHT,
                        bottom: 0,
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <CommentItem
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
                    isLast={isLastChild}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
