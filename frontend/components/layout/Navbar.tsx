'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@heroui/react/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownPopover } from '@heroui/react/dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@heroui/react/avatar';
import { Home, Bell, User, Moon, Sun, LogOut, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { notificationsApi } from '@/lib/api';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnreadCount = async () => {
        try {
          const count = await notificationsApi.getUnreadCount();
          setUnreadCount(count);
        } catch (err) {
          console.error('Failed to fetch unread count:', err);
        }
      };

      fetchUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isDark = mounted && theme === 'dark';

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === '/') return 'feed';
    if (pathname?.startsWith('/developers/') || pathname?.startsWith('/profile')) return 'profile';
    if (pathname?.startsWith('/notifications')) return 'notifications';
    return 'feed';
  };

  const handleTabChange = (key: React.Key) => {
    switch (key) {
      case 'feed':
        router.push('/');
        break;
      case 'profile':
        if (user) {
          router.push(`/developers/${user.id}`);
        }
        break;
      case 'notifications':
        router.push('/notifications');
        break;
    }
  };

  const AuthSection = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <Dropdown>
          <DropdownTrigger className="outline-none cursor-pointer">
            <Avatar className="h-9 w-9 ring-2 ring-brand-500/20 hover:ring-brand-500/40 transition-all bg-gradient-to-br from-brand-500 to-brand-600 text-white">
              {user.profilePicture ? (
                <AvatarImage src={`${API_URL}${user.profilePicture}`} alt={user.name} className="object-cover" />
              ) : (
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
          </DropdownTrigger>
          <DropdownPopover>
            <DropdownMenu>
              <DropdownItem key="user-info" className="cursor-default opacity-100" onPress={() => router.push('/profile/edit')} textValue={user.name}>
                <div className="flex items-center gap-2 py-1">
                  <User className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                  </div>
                </div>
              </DropdownItem>
              <DropdownItem
                key="dark-mode"
                onPress={() => setTheme(isDark ? 'light' : 'dark')}
                textValue={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
              </DropdownItem>
              <DropdownItem key="logout" onPress={handleLogout} className="text-red-600 dark:text-red-400" textValue="Logout">
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </div>
              </DropdownItem>
            </DropdownMenu>
          </DropdownPopover>
        </Dropdown>
      );
    }

    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="tertiary"
          size="sm"
          isIconOnly
          onPress={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="tertiary" size="sm" onPress={() => router.push('/auth/login')}>
          Login
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-md shadow-brand-500/30"
          onPress={() => router.push('/auth/register')}
        >
          Register
        </Button>
      </div>
    );
  };

  const navTabs = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl backdrop-saturate-200 bg-white/60 dark:bg-black/60 border-b border-gray-200/40 dark:border-gray-800/40 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo className="h-9 w-9 shrink-0" />
            <div className="flex flex-col">
              <div className="font-bold text-xl leading-none whitespace-nowrap">
                <span className="text-gray-900 dark:text-gray-100">Stack</span>
                <span className="bg-gradient-to-r from-[#FF5E00] to-[#ffa600] bg-clip-text text-transparent">Never</span>
                <span className="text-gray-900 dark:text-gray-100">flow</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100/60 dark:bg-gray-800/50 p-1 rounded-full backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = getActiveTab() === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer',
                        isSelected
                          ? 'text-brand-600 dark:text-brand-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="desktop-navbar-tab-indicator"
                          className="absolute inset-0 bg-white/95 dark:bg-gray-700/90 rounded-full shadow-md backdrop-blur-sm"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <div className="flex items-center gap-2 relative z-10">
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {tab.id === 'notifications' && unreadCount > 0 && (
                          <span className="h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-sm animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button
                size="sm"
                onPress={() => router.push('/posts/new')}
                className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-md shadow-brand-500/30"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="font-medium">Post</span>
              </Button>
            </nav>
          )}

          {/* Desktop Auth Section */}
          <div className="flex items-center gap-2 shrink-0">
            <AuthSection />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden py-3">
          {/* Logo and Auth Section Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Logo className="h-8 w-8 shrink-0" />
              <div className="flex flex-col">
                <div className="font-bold text-lg leading-none whitespace-nowrap">
                  <span className="text-gray-900 dark:text-gray-100">Stack</span>
                  <span className="bg-gradient-to-r from-[#FF5E00] to-[#ffa600] bg-clip-text text-transparent">Never</span>
                  <span className="text-gray-900 dark:text-gray-100">flow</span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              {isAuthenticated && (
                <Button
                  size="sm"
                  isIconOnly
                  onPress={() => router.push('/posts/new')}
                  className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-md shadow-brand-500/30"
                  aria-label="Create post"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <AuthSection />
            </div>
          </div>

          {/* Mobile Navigation Buttons */}
          {isAuthenticated && (
            <div className="flex items-center gap-1 bg-gray-100/60 dark:bg-gray-800/50 p-1 rounded-full w-full backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = getActiveTab() === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'relative flex-1 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer',
                      isSelected
                        ? 'text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="mobile-navbar-tab-indicator"
                        className="absolute inset-0 bg-white/95 dark:bg-gray-700/90 rounded-full shadow-md backdrop-blur-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <div className="flex items-center justify-center gap-1.5 relative z-10">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{tab.label}</span>
                      {tab.id === 'notifications' && unreadCount > 0 && (
                        <span className="h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-sm animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
