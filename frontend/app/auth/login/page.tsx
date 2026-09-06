'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@heroui/react/card';
import { AxiosError } from 'axios';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData);
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        setError(err.response.data.message || 'Login failed');
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

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              isDisabled={isLoading}
              className="w-full bg-[#1877F2] dark:bg-[#2D88FF] text-white hover:opacity-90"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-[#1877F2] dark:text-[#2D88FF] hover:underline font-medium">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
