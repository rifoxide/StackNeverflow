'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, ChevronDown, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@heroui/react/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime, countCommentDescendants } from '@/lib/comments';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { CommentReactionButtons } from './CommentReactionButtons';
import { CommentForm } from './CommentForm';
import type { Comment, ReactionType } from '@/lib/types';
import { cn } from '@/lib/utils';

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
  isLast = false,
}: CommentItemProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAuthor = currentUser?.id === comment.authorId;
  const showReplyForm = replyingTo === comment.id;
  const hasReplies = childrenComments.length > 0;
  const totalDescendants = countCommentDescendants(comment.id, commentsByParent);

  const submitReply = async (body: string) => {
    const created = await onAddComment(body, comment.id);
    const ok = created !== null;
    if (ok) onSetReplyingTo(null);
    return ok;
  };

  // Render collapsed summary row
  if (isCollapsed) {
    return (
      <div className={cn('relative flex items-center py-2', depth > 0 && 'ml-0')}>
        {/* Hierarchy connector lines from parent into this collapsed child */}
        {depth > 0 && (
          <>
            {/* Vertical line from top down to horizontal branch */}
            <div
              className="absolute w-[2px] bg-gray-300 dark:bg-gray-700 pointer-events-none"
              style={{
                left: -29,
                top: 0,
                height: 18,
              }}
              aria-hidden="true"
            />
            {/* Horizontal branch line into collapsed avatar */}
            <div
              className="absolute h-[2px] bg-gray-300 dark:bg-gray-700 pointer-events-none"
              style={{
                left: -29,
                top: 17,
                width: 29,
              }}
              aria-hidden="true"
            />
            {/* Vertical continuation line to next sibling if not last */}
            {!isLast && (
              <div
                className="absolute w-[2px] bg-gray-300 dark:bg-gray-700 pointer-events-none"
                style={{
                  left: -29,
                  top: 18,
                  bottom: 0,
                }}
                aria-hidden="true"
              />
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="group flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left w-full"
          aria-label={`Expand comment from ${comment.author.name}`}
        >
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand-500 transition-colors shrink-0" />
          <Avatar className="h-5 w-5 bg-[#1877F2] dark:bg-[#2D88FF] text-white shrink-0">
            {comment.author.profilePicture ? (
              <AvatarImage src={`${API_URL}${comment.author.profilePicture}`} alt={comment.author.name} className="object-cover" />
            ) : (
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            )}
          </Avatar>
          <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {comment.author.name}
          </span>
          {isAuthor && (
            <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#2D88FF]/20 dark:text-[#2D88FF]">
              You
            </span>
          )}
          <span>•</span>
          <span>{formatRelativeTime(comment.createdAt)}</span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-300 ml-1">
            {totalDescendants > 0 ? `+${totalDescendants} ${totalDescendants === 1 ? 'reply' : 'replies'}` : 'collapsed'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn('relative', depth === 0 ? 'py-3' : 'pt-2.5 pb-1.5')}>
      {/* Hierarchy connector lines from parent into this child comment */}
      {depth > 0 && (
        <>
          {/* Vertical line from top down to horizontal branch */}
          <div
            className="absolute w-[2px] bg-gray-300 dark:bg-gray-700 pointer-events-none"
            style={{
              left: -29,
              top: 0,
              height: 26,
            }}
            aria-hidden="true"
          />
          {/* Horizontal branch line connecting parent vertical line to this child avatar */}
          <div
            className="absolute h-[2px] bg-gray-300 dark:bg-gray-700 pointer-events-none"
            style={{
              left: -29,
              top: 25,
              width: 29,
            }}
            aria-hidden="true"
          />
          {/* Sibling continuation line down to next sibling if !isLast */}
          {!isLast && (
            <div
              className="absolute w-[2px] bg-gray-300 dark:bg-gray-700 pointer-events-none"
              style={{
                left: -29,
                top: 26,
                bottom: 0,
              }}
              aria-hidden="true"
            />
          )}
        </>
      )}

      {/* 1. Direct Content Row: Avatar & Body/Actions */}
      <div className="flex gap-3 relative">
        {/* Left Gutter: Author Avatar & Threadline reaching into avatar center */}
        <div className="w-8 shrink-0 relative flex flex-col items-center">
          <Link
            href={`/developers/${comment.author.id}`}
            className="relative z-10 transition-transform hover:scale-105"
            aria-label={`View ${comment.author.name}'s profile`}
          >
            <Avatar className="h-8 w-8 bg-[#1877F2] dark:bg-[#2D88FF] text-white ring-2 ring-transparent hover:ring-brand-500/30 transition-all">
              {comment.author.profilePicture ? (
                <AvatarImage src={`${API_URL}${comment.author.profilePicture}`} alt={comment.author.name} className="object-cover" />
              ) : (
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
          </Link>

          {/* Vertical threadline starting from the center of the avatar downwards to replies */}
          {hasReplies && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="group/threadline absolute w-4 flex justify-center cursor-pointer outline-none select-none z-0"
              style={{ top: depth === 0 ? 28 : 26, bottom: 0, left: 8 }}
              title="Click to collapse thread"
              aria-label={`Collapse comment thread by ${comment.author.name}`}
            >
              <div className="w-[2px] h-full bg-gray-300 dark:bg-gray-700 group-hover/threadline:bg-brand-500 dark:group-hover/threadline:bg-brand-400 transition-colors duration-150" />
            </button>
          )}
        </div>

        {/* Right Direct Content */}
        <div className="flex-1 min-w-0 pb-1">
          {/* Author Header */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-sm mb-1">
            <div className="flex items-center gap-2 flex-wrap">
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
              <span className="text-gray-400 dark:text-gray-500 text-xs">•</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            {/* Quick Collapse Button */}
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Collapse thread"
              aria-label="Collapse thread"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Comment Body */}
          <div className="text-sm">
            <MarkdownViewer
              content={comment.body}
              className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            />
          </div>

          {/* Action Toolbar */}
          <div className="mt-2.5">
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

          {/* Inline Reply Form */}
          {showReplyForm && (
            <div className="mt-3 pl-1">
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

      {/* 2. Nested Child Replies Container */}
      {hasReplies && (
        <div className="pl-11 relative">
          {childrenComments.map((child, i) => {
            const grandchildren = commentsByParent.get(child.id) ?? [];
            const isLastChild = i === childrenComments.length - 1;
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
                isLast={isLastChild}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
