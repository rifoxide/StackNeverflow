'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { developersApi, postsApi } from '@/lib/api';
import type { Developer, Post } from '@/lib/types';
import { Button } from '@heroui/react/button';
import { Card, CardHeader, CardContent } from '@heroui/react/card';
import { Skeleton } from '@heroui/react/skeleton';
import { Avatar, AvatarFallback } from '@heroui/react/avatar';
import { User, Briefcase, Code, Calendar, ArrowLeft, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/comments';

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2 rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
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
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
          Failed to load profile
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={() => router.push('/')} variant="secondary">
          Back to Feed
        </Button>
      </CardContent>
    </Card>
  );
}

function SkillBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1877F2]/10 dark:bg-[#2D88FF]/20 text-[#1877F2] dark:text-[#2D88FF] rounded-full text-sm font-medium">
      <Code className="h-3.5 w-3.5" />
      {name}
    </span>
  );
}

function ExperienceCard({ experience }: { experience: Developer['experiences'][0] }) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
    }).format(date);
  };

  const fromDate = formatDate(experience.fromDate);
  const toDate = formatDate(experience.toDate);

  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      <div className="flex-shrink-0 mt-1">
        <div className="h-10 w-10 rounded-full bg-[#1877F2]/10 dark:bg-[#2D88FF]/20 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-[#1877F2] dark:text-[#2D88FF]" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {experience.title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{experience.company}</p>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
          <Calendar className="h-3 w-3" />
          <span>
            {fromDate} - {toDate}
          </span>
        </div>
        {experience.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
            {experience.description}
          </p>
        )}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.id}`} className="block group">
      <Card className="hover:shadow-md transition-all">
        <CardHeader>
          <h3 className="font-semibold group-hover:text-[#1877F2] dark:group-hover:text-[#2D88FF] transition-colors">
            {post.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatRelativeTime(post.createdAt)} • {post.likesCount} likes • {post.commentCount}{' '}
            comments
          </p>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function DeveloperProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const developerId = params.id as string;

  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = user?.id === developerId;

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await developersApi.getById(developerId);
        setDeveloper(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Developer not found');
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (developerId) {
      fetchProfile();
    }
  }, [developerId]);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const response = await postsApi.getAll({ page: 1, limit: 10 });
        // Filter posts by this developer
        const developerPosts = response.data.filter((p) => p.author.id === developerId);
        setPosts(developerPosts);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    if (developerId) {
      fetchPosts();
    }
  }, [developerId]);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Button variant="tertiary" onClick={() => router.push('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>
      </div>

      {isLoading ? (
        <ProfileSkeleton />
      ) : error ? (
        <ErrorState error={error} />
      ) : developer ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 bg-[#1877F2] dark:bg-[#2D88FF] text-white mb-4">
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold mb-1">{developer.name}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Joined {formatJoinDate(developer.createdAt)}
                  </p>
                  {isOwnProfile && (
                    <Button
                      onClick={() => router.push('/profile/edit')}
                      className="w-full bg-[#1877F2] dark:bg-[#2D88FF] text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Skills
                </h2>
              </CardHeader>
              <CardContent>
                {developer.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {developer.skills.map((skill) => (
                      <SkillBadge key={skill.id} name={skill.name} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {isOwnProfile ? 'Add your skills to get started' : 'No skills listed yet'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Experience Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience
                </h2>
              </CardHeader>
              <CardContent>
                {developer.experiences.length > 0 ? (
                  <div className="space-y-6">
                    {developer.experiences
                      .sort((a, b) => {
                        // Sort by date, with null (Present) first
                        if (!a.toDate && b.toDate) return -1;
                        if (a.toDate && !b.toDate) return 1;
                        if (!a.toDate && !b.toDate) {
                          return new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime();
                        }
                        return new Date(b.toDate!).getTime() - new Date(a.toDate!).getTime();
                      })
                      .map((exp) => (
                        <ExperienceCard key={exp.id} experience={exp} />
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {isOwnProfile
                      ? 'Add your work experience to showcase your background'
                      : 'No experience listed yet'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Posts */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Recent Posts</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingPosts ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {isOwnProfile ? "You haven't created any posts yet" : 'No posts yet'}
                    </p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => router.push('/posts/new')}
                        className="bg-[#1877F2] dark:bg-[#2D88FF] text-white"
                      >
                        Create Your First Post
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
