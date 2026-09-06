'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/lib/api';
import { Card, CardContent } from '@heroui/react/card';
import { AxiosError } from 'axios';
import { PostForm } from '@/components/posts/PostForm';

export default function NewPostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ title: '', body: '' });

  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login?redirect=/posts/new');
    return null;
  }

  const handleSubmit = async (title: string, body: string) => {
    setError('');
    setIsSubmitting(true);

    try {
      const post = await postsApi.create({ title, body });
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
      setIsSubmitting(false);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, title: event.target.value }));
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
      <PostForm
        mode="create"
        title={formData.title}
        body={formData.body}
        error={error}
        isSubmitting={isSubmitting}
        backLabel="Back to Feed"
        onTitleChange={handleTitleChange}
        onBodyChange={(body) => setFormData((prev) => ({ ...prev, body }))}
        onSubmit={handleSubmit}
        onBack={() => router.push('/')}
      />
    </div>
  );
}
