'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api';
import type { Post } from '@/lib/types';
import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { TextArea } from '@heroui/react/textarea';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { Skeleton } from '@heroui/react/skeleton';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchPost = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await postsApi.getById(postId);

        // Check if user is the author
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
  }, [postId, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await postsApi.update(postId, {
        title: title.trim(),
        body: body.trim(),
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

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-10 w-32 mb-6 rounded-lg" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="text-center py-12 border-red-200 bg-red-50 dark:bg-red-950/30">
          <CardContent>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
              {error}
            </h3>
            <Button onClick={() => router.push('/')} variant="secondary" className="mt-4">
              Back to Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Button variant="tertiary" onClick={() => router.push(`/posts/${postId}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Edit Post</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Enter post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium mb-2">
                Body <span className="text-gray-500 text-xs">(Supports Markdown)</span>
              </label>
              <TextArea
                id="body"
                placeholder="Write your post content (supports markdown)"
                value={body}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                rows={12}
                required
                disabled={isSaving}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-[#1877F2] dark:bg-[#2D88FF] text-white"
                isDisabled={isSaving || !title.trim() || !body.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/posts/${postId}`)}
                isDisabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
