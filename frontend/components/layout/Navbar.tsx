'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, PenSquare } from 'lucide-react';
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavLinks = () => (
    <>
      <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
        <Home className="h-4 w-4" />
        <span>Feed</span>
      </Link>
      {isAuthenticated && (
        <Link
          href="/posts/new"
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
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
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:inline">{user.name}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Link href="/profile/edit" className="w-full">
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/developers/${user.id}`} className="w-full">
                View Public Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/auth/login')}>
          Login
        </Button>
        <Button size="sm" onClick={() => router.push('/auth/register')}>
          Register
        </Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#252728] shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <div className="flex flex-col">
              <div className="font-bold text-xl leading-none">
                <span className="text-foreground">Stack</span>
                <span className="text-primary">Never</span>
                <span className="text-foreground">flow</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide leading-tight">
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

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <nav className="flex flex-col gap-4">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Feed
                  </Link>
                  {isAuthenticated && (
                    <Link
                      href="/posts/new"
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      Create Post
                    </Link>
                  )}
                </nav>
                <div className="border-t pt-6">
                  {isAuthenticated && user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                      <Link
                        href="/profile/edit"
                        onClick={() => setMobileOpen(false)}
                        className="text-base hover:text-primary transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        href={`/developers/${user.id}`}
                        onClick={() => setMobileOpen(false)}
                        className="text-base hover:text-primary transition-colors"
                      >
                        View Public Profile
                      </Link>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setMobileOpen(false);
                          handleLogout();
                        }}
                        className="w-full"
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => {
                          setMobileOpen(false);
                          router.push('/auth/login');
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => {
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
