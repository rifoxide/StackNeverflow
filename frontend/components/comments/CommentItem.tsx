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
  /**
   * True when this comment is the last child of its parent. The last
   * child renders the mask (Rule 3) that covers the leftover stretch
   * of the parent's vertical guideline below its own avatar, so the
   * line visually stops at the last reply instead of running past it.
   * Optional — only set by the parent when mapping over siblings.
   */
  isLast?: boolean;
}

/**
 * Past MAX_INDENT_DEPTH we stop adding left margin and let the
 * guide line sit flush at the edge so the gutter doesn't
 * disappear off the viewport on mobile.
 */
const MAX_INDENT_DEPTH = 3;

// Reddit-style connector geometry.
//
// Every row's avatar center sits 28px from the top of its outer
// container: pt-3 (12) on the outer div + half the avatar height
// (h-8 w-8 = 32, so 16). That 28 is CURVE_HEIGHT below, and it's the
// y-coordinate where the parent's vertical guideline starts AND where
// the last-child mask starts — so the line visibly runs from the
// parent's avatar down to the last reply's avatar and stops there.
//
// The "└" curve drawn by each reply sits inside the reply's own indent
// wrapper. Its height is AVATAR_CENTER (16) in that local frame — the
// indent wrapper has no top padding, so its top is the row's top, and
// the horizontal leg lands at the avatar's vertical center.
//
// The outer-frame y-offset where the parent's vertical line and the
// last-child mask both start is 28 (pt-3 = 12 + AVATAR_CENTER = 16).
// That literal appears in the Tailwind class strings as `top-[28px]`
// because Tailwind's JIT needs the full class name at build time.
const AVATAR_CENTER = 1;

/**
 * Indent left offset in px for a given depth, matching the responsive
 * indentClass below. Returns both viewports because the indents differ
 * between mobile and desktop.
 */
function getIndentPx(depth: number): { mobile: number; desktop: number } {
  if (depth === 0) return { mobile: 0, desktop: 0 };
  if (depth === 1) return { mobile: 16, desktop: 60 }; // ml-4 md:ml-8
  if (depth === 2) return { mobile: 24, desktop: 480 }; // ml-6 md:ml-12
  return { mobile: 16, desktop: 16 }; // pl-4
}

/**
 * x-position of the parent's vertical line (Rule 1) and the last-child
 * mask (Rule 3): sits at the parent's avatar center in the outer frame.
 */
function getLineX(depth: number): { mobile: number; desktop: number } {
  const i = getIndentPx(depth);
  return {
    mobile: i.mobile + AVATAR_CENTER,
    desktop: i.desktop + AVATAR_CENTER,
  };
}

/**
 * Width of the child's "└" curve (Rule 2):
 *   childIndent − parentIndent − AVATAR_CENTER.
 * The curve is positioned at left: −curveWidth in the child's indent
 * wrapper, so its left edge lands at the parent's avatar x in the
 * parent's frame, and its right edge sits at the child's avatar.
 * Returns 0 (or negative) at depths where the indents don't grow enough
 * to leave room for a horizontal leg — the curve degenerates into a
 * straight vertical line in that case.
 */
function getCurveWidth(childDepth: number): { mobile: number; desktop: number } {
  const c = getIndentPx(childDepth);
  const p = getIndentPx(childDepth - 1);
  return {
    mobile: c.mobile - p.mobile - AVATAR_CENTER,
    desktop: c.desktop - p.desktop - AVATAR_CENTER,
  };
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
  const isAuthor = currentUser?.id === comment.authorId;
  const showReplyForm = replyingTo === comment.id;

  const submitReply = async (body: string) => {
    const created = await onAddComment(body, comment.id);
    const ok = created !== null;
    if (ok) onSetReplyingTo(null);
    return ok;
  };

  // Depth-based indent (margin/padding). `relative` anchors the child's
  // "└" curve (Rule 2) so its `left: -curveWidth` lines up with the
  // parent's vertical line in the parent's frame.
  const indentClass = cn(
    'relative',
    depth === 0
      ? ''
      : depth < MAX_INDENT_DEPTH
        ? cn('ml-4 md:ml-8', depth >= 2 && 'ml-6 md:ml-12')
        : 'pl-4',
  );

  const hasChildren = childrenComments.length > 0;
  const lineX = getLineX(depth);
  const curveW = getCurveWidth(depth);
  // Render the curve when any viewport has a positive width; the
  // responsive classes handle per-viewport visibility (a 0-width
  // curve on one viewport just collapses to the parent's line).
  const hasCurve =
    depth > 0 && (curveW.mobile > 0 || curveW.desktop > 0);
  // Only replies can be "last" — top-level comments have no parent's
  // guideline to mask. The mask's bottom:0 sits inside THIS comment's
  // outer div, which (since we're the last child) extends to the
  // bottom of our parent's outer div, so it covers exactly the
  // leftover stretch of the parent's line below our avatar.
  const showMask = isLast && depth > 0;

  return (
    <div className={cn('pt-3 relative', depth > 0 && 'mt-3')}>
      {showMask && (
        // Rule 3 — the LAST reply masks the leftover stretch of the
        // parent's guideline. Rendered inside THIS comment's outer
        // container, so `bottom: 0` aligns with the bottom of the
        // parent comment's outer container (since we're the last
        // child, our bottom IS the parent's bottom). `top: 28` lands
        // exactly at our avatar's vertical center, which is where
        // the parent's guideline passes through on its way down.
        // `var(--surface)` matches the surrounding card background
        // so the line looks like it cleanly stops at our avatar.
        <div
          aria-hidden
          style={{ backgroundColor: 'var(--surface)' }}
          className={cn(
            'absolute top-[28px] bottom-0 w-0.5 pointer-events-none',
            `left-[${lineX.mobile}px] md:left-[${lineX.desktop}px]`,
          )}
        />
      )}

      {hasChildren && (
        // Rule 1 — the line belongs to the PARENT, not the child.
        // It sits in this comment's outer container so `bottom: 0`
        // automatically stretches down to the bottom of our reply
        // subtree, no matter how tall the chain gets. `top: 28`
        // puts the top of the line at our own avatar's vertical
        // center (pt-3 + half of h-8 = 28 = CURVE_HEIGHT).
        <div
          aria-hidden
          className={cn(
            'absolute top-[28px] bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 pointer-events-none',
            `left-[${lineX.mobile}px] md:left-[${lineX.desktop}px]`,
          )}
        />
      )}

      <div className={indentClass}>
        {hasCurve && (
          // Rule 2 — each reply draws ONLY the "└" bend into its own
          // avatar. The bend lives in our indent wrapper so its
          // right edge (left: 0) sits at our avatar's left side, and
          // its left edge (left: -curveWidth) reaches back to the
          // parent's avatar center in the parent's frame — that's
          // the math getCurveWidth() encodes.
          // `top: 0` is the top of the indent wrapper (= the top of
          // the row), and `height: 16` (= AVATAR_CENTER, = h-4)
          // puts the horizontal leg exactly at our avatar center.
          <div
            aria-hidden
            className={cn(
              'absolute top-0 h-4 border-l-2 border-b-2 border-gray-200 dark:border-gray-700 rounded-bl-sm pointer-events-none',
              `-left-[${curveW.mobile}px] md:-left-[${curveW.desktop}px] w-[${curveW.mobile}px] md:w-[${curveW.desktop}px]`,
            )}
          />
        )}

        <div className="flex items-start gap-2.5">
          <Link
            href={`/developers/${comment.author.id}`}
            className="flex-shrink-0 relative z-10"
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
          {childrenComments.map((child, idx) => {
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
                isLast={idx === childrenComments.length - 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
