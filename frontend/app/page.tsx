'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { postsApi, reactionsApi } from '@/lib/api';
import type { Post, ReactionType } from '@/lib/types';
import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { Skeleton } from '@heroui/react/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@heroui/react/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownPopover } from '@heroui/react/dropdown';
import { MessageSquare, Search, User, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { formatRelativeTime } from '@/lib/comments';
import { PostReactionButtons } from '@/components/posts/PostReactionButtons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function PostSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 mt-2 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 mt-2 rounded-lg" />
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ search }: { search: string }) {
  const router = useRouter();

  return (
    <Card className="text-center py-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-gray-200 dark:border-gray-800">
      <CardContent>
        <MessageSquare className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          {search ? 'No posts found' : 'No posts yet'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {search
            ? 'Try adjusting your search terms'
            : 'Be the first to share your knowledge with the community!'}
        </p>
        {!search && (
          <Button
            onClick={() => router.push('/posts/new')}
            className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg shadow-brand-500/30"
          >
            Create First Post
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="text-center py-12 border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm">
      <CardContent>
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Failed to load posts</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={onRetry} variant="secondary" className="shadow-md">
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function PostCard({
  post,
  userReaction,
  onUpdate,
  onDelete,
  currentUserId,
}: {
  post: Post;
  userReaction: ReactionType | null;
  onUpdate: (postId: string, newCounts: { likesCount: number; dislikesCount: number }) => void;
  onDelete: (postId: string) => void;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    }
  }, [post.body]);

  const isOwnPost = currentUserId && post.author.id === currentUserId;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postsApi.delete(post.id);
      onDelete(post.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If user clicked an interactive element (link, button, dropdown, etc.), don't navigate to post detail
    const target = e.target as HTMLElement;
    if (target.closest('a, button, [role="button"], [role="menuitem"], input, textarea, select')) {
      return;
    }
    router.push(`/posts/${post.id}`);
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        className="cursor-pointer hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40 transition-all duration-300 border-0 shadow-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:-translate-y-1"
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Link
                  href={`/developers/${post.author.id}`}
                  className="flex items-center gap-3 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-brand-500 to-brand-600 text-white ring-2 ring-brand-500/20 shrink-0">
                    {post.author.profilePicture ? (
                      <AvatarImage src={`${API_URL}${post.author.profilePicture}`} alt={post.author.name} className="object-cover" />
                    ) : (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{post.author.name}</span>
                </Link>
                {isOwnPost && (
                  <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#2D88FF]/20 dark:text-[#2D88FF]">
                    You
                  </span>
                )}
                <span>•</span>
                <span>{formatRelativeTime(post.createdAt)}</span>
                {post.updatedAt !== post.createdAt && (
                  <>
                    <span>•</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                      edited
                    </span>
                  </>
                )}
              </div>
              <Link href={`/posts/${post.id}`} className="group">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {post.title}
                </h2>
              </Link>
            </div>
            {isOwnPost && (
              <Dropdown>
                <DropdownTrigger className="outline-none cursor-pointer inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </DropdownTrigger>
                <DropdownPopover>
                  <DropdownMenu>
                    <DropdownItem
                      key="edit"
                      onPress={() => router.push(`/posts/${post.id}/edit`)}
                      textValue="Edit Post"
                    >
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        <span>Edit Post</span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      onPress={() => setShowDeleteDialog(true)}
                      className="text-red-600 dark:text-red-400"
                      textValue="Delete Post"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Post</span>
                      </div>
                    </DropdownItem>
                  </DropdownMenu>
                </DropdownPopover>
              </Dropdown>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div ref={contentRef} className="prose prose-sm dark:prose-invert max-w-none line-clamp-3">
            <MarkdownViewer content={post.body} />
          </div>
          {isTruncated && (
            <div className="mt-2 mb-4">
              <span className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                See more →
              </span>
            </div>
          )}
          {!isTruncated && <div className="mb-4" />}
          <PostReactionButtons
            postId={post.id}
            initialLikesCount={post.likesCount}
            initialDislikesCount={post.dislikesCount}
            commentCount={post.commentCount}
            initialUserReaction={userReaction}
            size="sm"
            onReactionChange={(newCounts) => onUpdate(post.id, newCounts)}
            onCommentClick={() => router.push(`/posts/${post.id}`)}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-md w-full mx-4 shadow-2xl animate-scale-in">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Post</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteDialog(false)}
                  isDisabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30"
                  onClick={handleDelete}
                  isDisabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType | null>>({});

  const fetchPosts = useCallback(
    async (currentPage: number, searchQuery: string) => {
      setIsLoading(true);
      setError('');
      try {
        const response = await postsApi.getAll({
          page: currentPage,
          limit: 20,
          search: searchQuery || undefined,
        });
        setPosts(response.data);
        setTotalPages(response.meta.totalPages);

        // Batch fetch user reactions for all posts
        if (isAuthenticated && response.data.length > 0) {
          try {
            const postIds = response.data.map((post) => post.id);
            const reactions = await reactionsApi.getMineBatch('post', postIds);
            setUserReactions(reactions);
          } catch (err) {
            console.error('Failed to fetch user reactions:', err);
          }
        } else {
          setUserReactions({});
        }
      } catch (err) {
        setError('Failed to load posts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    fetchPosts(page, search);
  }, [page, search, fetchPosts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const handleRetry = () => {
    fetchPosts(page, search);
  };

  const handlePostUpdate = (postId: string, newCounts: { likesCount: number; dislikesCount: number }) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, ...newCounts } : post
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Feed</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Discover knowledge shared by the community
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
          <Input
            type="search"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : posts.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userReaction={userReactions[post.id] ?? null}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
                currentUserId={user?.id}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  isDisabled={page === 1}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  isDisabled={page === totalPages}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
