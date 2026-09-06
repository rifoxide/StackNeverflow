'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@heroui/react/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react/dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@heroui/react/avatar';
import { TabsRoot, TabList, Tab } from '@heroui/react/tabs';
import { Menu, Home, Bell, User, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { notificationsApi } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

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
          <DropdownTrigger>
            <span className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none cursor-pointer">
              <Avatar className="h-8 w-8 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
                {user.profilePicture ? (
                  <AvatarImage src={`${API_URL}${user.profilePicture}`} alt={user.name} />
                ) : (
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-sm font-medium hidden md:inline">{user.name}</span>
            </span>
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
    <header className="sticky top-0 z-50 w-full backdrop-blur-md shadow-sm">
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
            {isAuthenticated && (
              <TabsRoot
                selectedKey={getActiveTab()}
                onSelectionChange={handleTabChange}
                variant="primary"
              >
                <TabList className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
                  <Tab id="feed" className="px-4 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Feed</span>
                    </div>
                  </Tab>
                  <Tab id="profile" className="px-4 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </div>
                  </Tab>
                  <Tab id="notifications" className="px-4 py-2 rounded-full data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:shadow-sm transition-all">
                    <div className="flex items-center gap-2 relative">
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
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
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-white dark:bg-gray-900 overflow-y-auto">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
              <ThemeToggle />
            </div>

            {isAuthenticated && (
              <nav className="flex flex-col gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span>Feed</span>
                </Link>
                <Link
                  href={`/developers/${user?.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
                >
                  <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Notifications</span>
                </Link>
              </nav>
            )}

            {!isAuthenticated && (
              <nav className="flex flex-col gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium hover:text-[#1877F2] dark:hover:text-[#2D88FF] transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span>Feed</span>
                </Link>
              </nav>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <Avatar className="h-10 w-10 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
                      {user.profilePicture ? (
                        <AvatarImage src={`${API_URL}${user.profilePicture}`} alt={user.name} />
                      ) : (
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      )}
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
                    Edit Profile
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
