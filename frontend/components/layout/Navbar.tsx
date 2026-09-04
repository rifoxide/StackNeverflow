'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@heroui/react/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react/dropdown';
import { Avatar, AvatarFallback } from '@heroui/react/avatar';
import { Menu, Home, PenSquare, User, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const NavLinks = () => (
    <>
      <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors">
        <Home className="h-4 w-4" />
        <span>Feed</span>
      </Link>
      {isAuthenticated && (
        <Link
          href="/posts/new"
          className="flex items-center gap-2 text-sm font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
        >
          <PenSquare className="h-4 w-4" />
          <span>Create Post</span>
        </Link>
      )}
    </>
  );

  const AuthSection = () => {
    if (isAuthenticated && user) {
      return (
        <Dropdown>
          <DropdownTrigger>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
              <Avatar className="h-8 w-8 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:inline">{user.name}</span>
            </button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem onPress={() => router.push('/profile/edit')}>
              My Profile
            </DropdownItem>
            <DropdownItem onPress={() => router.push(`/developers/${user.id}`)}>
              View Public Profile
            </DropdownItem>
            <DropdownItem onPress={handleLogout} className="text-red-600 dark:text-red-400">
              Logout
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button variant="tertiary" size="sm" onPress={() => router.push('/auth/login')}>
          Login
        </Button>
        <Button
          size="sm"
          className="bg-[#1877F2] dark:bg-[#2D88FF] text-white"
          onPress={() => router.push('/auth/register')}
        >
          Register
        </Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#252728]/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <div className="flex flex-col">
              <div className="font-bold text-xl leading-none">
                <span className="text-gray-900 dark:text-gray-100">Stack</span>
                <span className="text-[#1877F2] dark:text-[#2D88FF]">Never</span>
                <span className="text-gray-900 dark:text-gray-100">flow</span>
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-wide leading-tight">
                Where your stack stays intact
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>

          {/* Desktop Auth Section + Theme Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <AuthSection />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-white dark:bg-[#252728] z-40 overflow-y-auto">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
              <ThemeToggle />
            </div>
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="text-lg font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
              >
                Feed
              </Link>
              {isAuthenticated && (
                <Link
                  href="/posts/new"
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
                >
                  Create Post
                </Link>
              )}
            </nav>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <Avatar className="h-10 w-10 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
                    </div>
                  </div>
                  <Link
                    href="/profile/edit"
                    onClick={() => setMobileOpen(false)}
                    className="text-base hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
                  >
                    My Profile
                  </Link>
                  <Link
                    href={`/developers/${user.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="text-base hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
                  >
                    View Public Profile
                  </Link>
                  <Button
                    className="w-full bg-red-600 text-white"
                    onPress={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="w-full bg-[#1877F2] dark:bg-[#2D88FF] text-white"
                    onPress={() => {
                      setMobileOpen(false);
                      router.push('/auth/login');
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onPress={() => {
                      setMobileOpen(false);
                      router.push('/auth/register');
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
