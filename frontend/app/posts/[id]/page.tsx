'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi, reactionsApi } from '@/lib/api';
import type { Post, ReactionType } from '@/lib/types';
import { Button } from '@heroui/react/button';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { Skeleton } from '@heroui/react/skeleton';
import { Avatar, AvatarFallback } from '@heroui/react/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownPopover } from '@heroui/react/dropdown';
import { ArrowLeft, User, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { CommentSection } from '@/components/comments/CommentSection';
import { PostReactionButtons } from '@/components/posts/PostReactionButtons';
import { useAuth } from '@/contexts/AuthContext';

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
    <Card className="text-center py-12 border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm">
      <CardContent>
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Failed to load post</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={() => router.push('/')} variant="secondary" className="shadow-md">
          Back to Feed
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isLoadingReaction, setIsLoadingReaction] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch user's reaction if authenticated
  useEffect(() => {
    const fetchUserReaction = async () => {
      if (!isAuthenticated || !postId) return;

      setIsLoadingReaction(true);
      try {
        const reaction = await reactionsApi.getMine('post', postId);
        setUserReaction(reaction);
      } catch (err) {
        console.error('Failed to fetch user reaction:', err);
      } finally {
        setIsLoadingReaction(false);
      }
    };

    fetchUserReaction();
  }, [postId, isAuthenticated]);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postsApi.delete(postId);
      router.push('/');
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      setError('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const isOwnPost = post && user && post.author.id === user.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="tertiary" onClick={() => router.push('/')} className="mb-4 hover:text-brand-600 dark:hover:text-brand-400">
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
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">{post.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Link
                      href={`/developers/${post.author.id}`}
                      className="flex items-center gap-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      <Avatar className="h-8 w-8 bg-gradient-to-br from-brand-500 to-brand-600 text-white ring-2 ring-brand-500/20">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{post.author.name}</span>
                    </Link>
                    <span>•</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                {isOwnPost && (
                  <Dropdown>
                    <DropdownTrigger className="outline-none cursor-pointer inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <MoreVertical className="h-5 w-5" />
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
              {/* Post Body with Markdown */}
              <MarkdownViewer content={post.body} className="mb-6" />

              {/* Reaction Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!isLoadingReaction && (
                  <PostReactionButtons
                    postId={post.id}
                    initialLikesCount={post.likesCount}
                    initialDislikesCount={post.dislikesCount}
                    commentCount={post.commentCount}
                    initialUserReaction={userReaction}
                    size="md"
                    onReactionChange={(newCounts) => {
                      setPost((p) =>
                        p ? { ...p, ...newCounts } : p
                      );
                    }}
                  />
                )}
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

          {/* Delete Confirmation Dialog */}
          {showDeleteDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
              <Card className="max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Post</h2>
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
                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30"
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
        </div>
      ) : null}
    </div>
  );
}
