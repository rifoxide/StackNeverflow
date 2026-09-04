'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api';
import type { Post } from '@/lib/types';
import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { Skeleton } from '@heroui/react/skeleton';
import { Avatar, AvatarFallback } from '@heroui/react/avatar';
import { ThumbsUp, ThumbsDown, MessageSquare, Search, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MarkdownViewer } from '@/components/MarkdownViewer';

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

function PostCard({ post }: { post: Post }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-lg transition-all border-0 shadow-sm bg-white dark:bg-[#252728]">
      <CardHeader>
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
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <Link href={`/posts/${post.id}`} className="group">
          <h2 className="text-xl font-semibold group-hover:text-[#1877F2] dark:group-hover:text-[#2D88FF] transition-colors">
            {post.title}
          </h2>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 mb-4">
          <MarkdownViewer content={post.body} />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{post.likesCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="h-4 w-4" />
            <span>{post.dislikesCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{post.commentCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

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
      } catch (err) {
        setError('Failed to load posts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    []
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
              <PostCard key={post.id} post={post} />
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
