'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '@/lib/api';
import type { Post } from '@/lib/types';
import { Button } from '@heroui/react/button';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { Skeleton } from '@heroui/react/skeleton';
import { Avatar, AvatarFallback } from '@heroui/react/avatar';
import { ThumbsUp, ThumbsDown, MessageSquare, ArrowLeft, User } from 'lucide-react';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { CommentSection } from '@/components/comments/CommentSection';

function PostSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2 rounded-lg" />
          <Skeleton className="h-4 w-full mb-2 rounded-lg" />
          <Skeleton className="h-4 w-5/6 mb-4 rounded-lg" />
          <div className="flex gap-4 mt-6">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  const router = useRouter();

  return (
    <Card className="text-center py-12 border-red-200 bg-red-50 dark:bg-red-950/30">
      <CardContent>
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Failed to load post</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={() => router.push('/')} variant="secondary">
          Back to Feed
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await postsApi.getById(postId);
        setPost(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Post not found');
        } else {
          setError('Failed to load post. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="tertiary" onClick={() => router.push('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>
      </div>

      {isLoading ? (
        <PostSkeleton />
      ) : error ? (
        <ErrorState error={error} />
      ) : post ? (
        <div className="space-y-6">
          {/* Main Post Card */}
          <Card>
            <CardHeader>
              <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
            </CardHeader>
            <CardContent>
              {/* Post Body with Markdown */}
              <MarkdownViewer content={post.body} className="mb-6" />

              {/* Reaction Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" size="sm" className="gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.likesCount}</span>
                </Button>
                <Button variant="secondary" size="sm" className="gap-2">
                  <ThumbsDown className="h-4 w-4" />
                  <span>{post.dislikesCount}</span>
                </Button>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-auto">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentCount} comments</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <CommentSection
            postId={post.id}
            onCommentCreated={() =>
              setPost((p) =>
                p ? { ...p, commentCount: p.commentCount + 1 } : p,
              )
            }
          />
        </div>
      ) : null}
    </div>
  );
}
