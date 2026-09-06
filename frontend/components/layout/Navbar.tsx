'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@heroui/react/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownPopover } from '@heroui/react/dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@heroui/react/avatar';
import { TabsRoot, TabList, Tab } from '@heroui/react/tabs';
import { Home, Bell, User, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { notificationsApi } from '@/lib/api';
import { useTheme } from 'next-themes';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
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
      <div className="flex items-center gap-2">
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

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <div className="flex flex-col">
              <div className="font-bold text-xl leading-none">
                <span className="text-gray-900 dark:text-gray-100">Stack</span>
                <span className="bg-gradient-to-r from-[#FF5E00] to-[#ffa600] bg-clip-text text-transparent">Never</span>
                <span className="text-gray-900 dark:text-gray-100">flow</span>
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium tracking-wide leading-tight">
                
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-6">
            {isAuthenticated && (
              <TabsRoot
                selectedKey={getActiveTab()}
                onSelectionChange={handleTabChange}
                variant="primary"
              >
                <TabList className="flex gap-1.5 bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-full backdrop-blur-sm">
                  <Tab id="feed" className="px-4 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-lg data-[selected=true]:shadow-brand-500/10 transition-all text-gray-600 dark:text-gray-400 data-[selected=true]:text-brand-600 dark:data-[selected=true]:text-brand-400">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span className="font-medium">Feed</span>
                    </div>
                  </Tab>
                  <Tab id="profile" className="px-4 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-lg data-[selected=true]:shadow-brand-500/10 transition-all text-gray-600 dark:text-gray-400 data-[selected=true]:text-brand-600 dark:data-[selected=true]:text-brand-400">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Profile</span>
                    </div>
                  </Tab>
                  <Tab id="notifications" className="px-4 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-lg data-[selected=true]:shadow-brand-500/10 transition-all text-gray-600 dark:text-gray-400 data-[selected=true]:text-brand-600 dark:data-[selected=true]:text-brand-400">
                    <div className="flex items-center gap-2 relative">
                      <Bell className="h-4 w-4" />
                      <span className="font-medium">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-lg animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </Tab>
                </TabList>
              </TabsRoot>
            )}
            {!isAuthenticated && (
              <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors">
                <Home className="h-4 w-4" />
                <span>Feed</span>
              </Link>
            )}
          </nav>

          {/* Desktop Auth Section */}
          <div className="flex items-center gap-2">
            <AuthSection />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden py-4">
          {/* Logo and Auth Section Row */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <div className="flex flex-col">
                <div className="font-bold text-lg leading-none">
                  <span className="text-gray-900 dark:text-gray-100">Stack</span>
                  <span className="bg-gradient-to-r from-[#FF5E00] to-[#ffa600] bg-clip-text text-transparent">Never</span>
                  <span className="text-gray-900 dark:text-gray-100">flow</span>
                </div>
              </div>
            </Link>

            <AuthSection />
          </div>

          {/* Mobile Navigation Buttons */}
          {isAuthenticated && (
            <TabsRoot
              selectedKey={getActiveTab()}
              onSelectionChange={handleTabChange}
              variant="primary"
            >
              <TabList className="flex gap-1.5 bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-full w-full backdrop-blur-sm">
                <Tab id="feed" className="flex-1 px-3 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-lg transition-all text-gray-600 dark:text-gray-400 data-[selected=true]:text-brand-600 dark:data-[selected=true]:text-brand-400">
                  <div className="flex items-center justify-center gap-1.5">
                    <Home className="h-4 w-4" />
                    <span className="text-sm font-medium">Feed</span>
                  </div>
                </Tab>
                <Tab id="profile" className="flex-1 px-3 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-lg transition-all text-gray-600 dark:text-gray-400 data-[selected=true]:text-brand-600 dark:data-[selected=true]:text-brand-400">
                  <div className="flex items-center justify-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Profile</span>
                  </div>
                </Tab>
                <Tab id="notifications" className="flex-1 px-3 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-lg transition-all text-gray-600 dark:text-gray-400 data-[selected=true]:text-brand-600 dark:data-[selected=true]:text-brand-400">
                  <div className="flex items-center justify-center gap-1.5 relative">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[9px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-lg animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </Tab>
              </TabList>
            </TabsRoot>
          )}

          {!isAuthenticated && (
            <Link href="/" className="flex items-center justify-center gap-2 text-sm font-medium bg-gray-100/80 dark:bg-gray-800/80 py-2 px-4 rounded-full text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all">
              <Home className="h-4 w-4" />
              <span>Feed</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
