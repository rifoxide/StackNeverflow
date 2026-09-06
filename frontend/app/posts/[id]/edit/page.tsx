'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api';
import type { Post } from '@/lib/types';
import { Card, CardContent } from '@heroui/react/card';
import { Skeleton } from '@heroui/react/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { PostForm } from '@/components/posts/PostForm';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/posts/${postId}/edit`);
      return;
    }

    const fetchPost = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await postsApi.getById(postId);

        if (data.author.id !== user?.id) {
          setError('You can only edit your own posts');
          return;
        }

        setPost(data);
        setTitle(data.title);
        setBody(data.body);
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
  }, [postId, isAuthenticated, authLoading, user, router]);

  const handleSubmit = async (nextTitle: string, nextBody: string) => {
    setIsSaving(true);
    setError('');

    try {
      await postsApi.update(postId, {
        title: nextTitle,
        body: nextBody,
      });

      router.push(`/posts/${postId}`);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You can only edit your own posts');
      } else if (err.response?.status === 404) {
        setError('Post not found');
      } else {
        setError('Failed to update post. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-32 mb-6 rounded-lg" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="text-center py-12 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <CardContent>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
              {error}
            </h3>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
            >
              Back to Feed
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <PostForm
        mode="edit"
        title={title}
        body={body}
        error={error}
        isSubmitting={isSaving}
        backLabel="Back to Post"
        onTitleChange={(event) => setTitle(event.target.value)}
        onBodyChange={setBody}
        onSubmit={handleSubmit}
        onBack={() => router.push(`/posts/${postId}`)}
      />
    </div>
  );
}
