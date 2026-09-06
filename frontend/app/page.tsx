'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { postsApi, reactionsApi } from '@/lib/api';
import type { Post, ReactionType } from '@/lib/types';
import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { Skeleton } from '@heroui/react/skeleton';
import { Avatar, AvatarFallback } from '@heroui/react/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownPopover } from '@heroui/react/dropdown';
import { MessageSquare, Search, User, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { formatRelativeTime } from '@/lib/comments';
import { PostReactionButtons } from '@/components/posts/PostReactionButtons';

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
    <Card className="text-center py-12">
      <CardContent>
        <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">
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
            className="bg-[#1877F2] dark:bg-[#2D88FF] text-white"
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
    <Card className="text-center py-12 border-red-200 bg-red-50 dark:bg-red-950/30">
      <CardContent>
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Failed to load posts</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={onRetry} variant="secondary">
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

  return (
    <>
      <Card className="hover:shadow-lg transition-all border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Link
                  href={`/developers/${post.author.id}`}
                  className="flex items-center gap-2 hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
                >
                  <Avatar className="h-8 w-8 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{post.author.name}</span>
                </Link>
                <span>•</span>
                <span>{formatRelativeTime(post.createdAt)}</span>
              </div>
              <Link href={`/posts/${post.id}`} className="group">
                <h2 className="text-xl font-semibold group-hover:text-[#1877F2] dark:group-hover:text-[#2D88FF] transition-colors">
                  {post.title}
                </h2>
              </Link>
            </div>
            {isOwnPost && (
              <Dropdown>
                <DropdownTrigger className="outline-none cursor-pointer">
                  <Button variant="tertiary" size="sm" isIconOnly>
                    <MoreVertical className="h-5 w-5" />
                  </Button>
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
          <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 mb-4">
            <MarkdownViewer content={post.body} />
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <h2 className="text-xl font-bold">Delete Post</h2>
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
                  className="bg-red-600 text-white hover:bg-red-700"
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
  const router = useRouter();
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Feed</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Discover knowledge shared by the community
            </p>
          </div>
          {isAuthenticated && (
            <Button
              onClick={() => router.push('/posts/new')}
              className="bg-[#1877F2] dark:bg-[#2D88FF] text-white"
            >
              Create Post
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            type="search"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
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
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  isDisabled={page === totalPages}
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
