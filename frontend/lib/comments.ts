import type { Comment } from './types';

/**
 * Pure helpers for the comments feature.
 *
 * Kept side-effect-free so they can be unit-tested without React or
 * the API client in scope.
 */

/**
 * Bucket a flat list of comments by their `parentCommentId`.
 *
 * Top-level comments land under the `null` key. Replies whose parent
 * isn't in the loaded set are bucketed as top-level instead of being
 * dropped — defensive guard against stale or partial data.
 */
export function groupCommentsByParent(
  comments: Comment[],
): Map<string | null, Comment[]> {
  const byId = new Set(comments.map((c) => c.id));
  const groups = new Map<string | null, Comment[]>();

  for (const c of comments) {
    // Orphan reply: parent is missing or has been filtered out.
    const isOrphan =
      c.parentCommentId !== null && !byId.has(c.parentCommentId);
    const key = isOrphan ? null : c.parentCommentId;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(c);
    } else {
      groups.set(key, [c]);
    }
  }

  return groups;
}

/**
 * Relative time string ("just now", "5m ago", "3h ago", "2d ago",
 * then a localized date). Purely string-based so the result is
 * consistent across server and client renders.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  // Older than a week — fall back to an absolute date.
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
