'use client';

import type { ChangeEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@heroui/react/card';
import { MarkdownEditor } from '@/components/MarkdownEditor';

type PostFormMode = 'create' | 'edit';

interface PostFormProps {
  mode: PostFormMode;
  title: string;
  body: string;
  error: string;
  isSubmitting: boolean;
  backLabel: string;
  onTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBodyChange: (value: string) => void;
  onSubmit: (title: string, body: string) => void;
  onBack: () => void;
}

export function PostForm({
  mode,
  title,
  body,
  error,
  isSubmitting,
  backLabel,
  onTitleChange,
  onBodyChange,
  onSubmit,
  onBack,
}: PostFormProps) {
  const isEdit = mode === 'edit';

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !body.trim()) {
      return;
    }

    onSubmit(title.trim(), body.trim());
  };

  return (
    <>
      <div className="mb-6">
        <Button variant="tertiary" onClick={onBack} className="mb-4" isDisabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backLabel}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Post' : 'Create a Post'}</CardTitle>
          <CardDescription>
            {isEdit
              ? 'Update your post and share the latest version with the community'
              : 'Share your knowledge, ask questions, or start a discussion'}
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
                value={title}
                onChange={onTitleChange}
                required
                disabled={isSubmitting}
                maxLength={255}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {title.length}/255 characters
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="body" className="text-sm font-medium">
                Body
              </label>
              <MarkdownEditor
                value={body}
                onChange={onBodyChange}
                placeholder="I am trying to implement JWT authentication in my NestJS application but I'm getting errors when trying to validate tokens..."
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Markdown is supported for formatting. Use ```language for code blocks.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                isDisabled={isSubmitting || !title.trim() || !body.trim()}
                className="flex-1 bg-[#1877F2] dark:bg-[#2D88FF] text-white"
              >
                {isSubmitting
                  ? isEdit
                    ? 'Saving...'
                    : 'Creating...'
                  : isEdit
                    ? 'Save Changes'
                    : 'Create Post'}
              </Button>
              <Button type="button" variant="secondary" onClick={onBack} isDisabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
    </>
  );
}
