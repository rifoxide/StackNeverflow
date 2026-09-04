'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '@/lib/api';
import type { Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThumbsUp, ThumbsDown, MessageSquare, ArrowLeft } from 'lucide-react';
import { MarkdownViewer } from '@/components/MarkdownViewer';

function PostSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-4" />
          <div className="flex gap-4 mt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  const router = useRouter();

  return (
    <Card className="text-center py-12 border-red-200 bg-red-50">
      <CardContent>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load post</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={() => router.push('/')} variant="outline">
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
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href={`/developers/${post.author.id}`}
                  className="hover:text-primary transition-colors font-medium"
                >
                  {post.author.name}
                </Link>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Post Body with Markdown */}
              <MarkdownViewer content={post.body} className="mb-6" />

              {/* Reaction Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.likesCount}</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <ThumbsDown className="h-4 w-4" />
                  <span>{post.dislikesCount}</span>
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentCount} comments</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section Placeholder */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Comments will be implemented in the next step</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
