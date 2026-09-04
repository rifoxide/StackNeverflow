'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [showPreview, setShowPreview] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create a Post</CardTitle>
          <CardDescription>
            Share your knowledge, ask questions, or start a discussion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
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
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/255 characters
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="body" className="text-sm font-medium">
                  Body
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>

              {showPreview ? (
                <div className="min-h-[200px] p-4 border rounded-lg bg-muted/30">
                  {formData.body ? (
                    <div className="prose prose-sm max-w-none">
                      {formData.body.split('\n').map((line, i) => (
                        <p key={i}>{line || ' '}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Nothing to preview yet</p>
                  )}
                </div>
              ) : (
                <Textarea
                  id="body"
                  name="body"
                  placeholder="I am trying to implement JWT authentication in my NestJS application but I'm getting errors when trying to validate tokens..."
                  value={formData.body}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  rows={12}
                  className="resize-none"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Markdown is supported for formatting
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Post'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                disabled={isLoading}
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
          <CardTitle className="text-lg">Tips for a great post</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Use a clear, descriptive title</li>
            <li>Include relevant code snippets or error messages</li>
            <li>Explain what you&apos;ve already tried</li>
            <li>Be respectful and constructive</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
