'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/lib/api';
import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@heroui/react/card';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { AxiosError } from 'axios';
import { ArrowLeft } from 'lucide-react';

export default function NewPostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
  });

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login?redirect=/posts/new');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.title.trim().length === 0) {
      setError('Title is required');
      return;
    }

    if (formData.body.trim().length === 0) {
      setError('Body is required');
      return;
    }

    setIsLoading(true);

    try {
      const post = await postsApi.create(formData);
      router.push(`/posts/${post.id}`);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data;
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          setError(data.errors.join(', '));
        } else {
          setError(data.message || 'Failed to create post');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="tertiary" onClick={() => router.push('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a Post</CardTitle>
          <CardDescription>
            Share your knowledge, ask questions, or start a discussion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="How do I implement JWT authentication in NestJS?"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isLoading}
                maxLength={255}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formData.title.length}/255 characters
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="body" className="text-sm font-medium">
                Body
              </label>
              <MarkdownEditor
                value={formData.body}
                onChange={(value) => setFormData((prev) => ({ ...prev, body: value }))}
                placeholder="I am trying to implement JWT authentication in my NestJS application but I'm getting errors when trying to validate tokens..."
                disabled={isLoading}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Markdown is supported for formatting. Use ```language for code blocks.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                isDisabled={isLoading}
                className="flex-1 bg-[#1877F2] dark:bg-[#2D88FF] text-white"
              >
                {isLoading ? 'Creating...' : 'Create Post'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/')}
                isDisabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tips for a great post</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-400">
          <ul className="list-disc list-inside space-y-1">
            <li>Use a clear, descriptive title</li>
            <li>Include relevant code snippets with syntax highlighting</li>
            <li>Format code blocks with ```language (e.g., ```javascript, ```python)</li>
            <li>Explain what you&apos;ve already tried</li>
            <li>Be respectful and constructive</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
