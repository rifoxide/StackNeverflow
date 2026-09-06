'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@heroui/react/card';
import { Avatar, AvatarFallback, AvatarImage } from '@heroui/react/avatar';
import { Button } from '@heroui/react/button';
import { Skeleton } from '@heroui/react/skeleton';
import { Bell, ThumbsUp, ThumbsDown, MessageSquare, User, Check, Trash2 } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import type { Notification } from '@/lib/types/notifications';
import { formatRelativeTime } from '@/lib/comments';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg" />
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const iconClass = 'h-3 w-3';

  switch (type) {
    case 'post_reaction':
    case 'comment_reaction':
      return <ThumbsUp className={iconClass} />;
    case 'post_comment':
      return <MessageSquare className={iconClass} />;
    case 'comment_reply':
      return <MessageSquare className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to the appropriate page
    if (notification.type === 'post_reaction' || notification.type === 'post_comment') {
      router.push(`/posts/${notification.targetId}`);
    } else if (notification.commentId) {
      router.push(`/posts/${notification.targetId}#comment-${notification.commentId}`);
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
      }`}
    >
      <Link
        href={`/developers/${notification.actor.id}`}
        className="flex-shrink-0"
      >
        <Avatar className="h-10 w-10 bg-[#1877F2] dark:bg-[#2D88FF] text-white">
          {notification.actor.profilePicture ? (
            <AvatarImage
              src={`${API_URL}${notification.actor.profilePicture}`}
              alt={notification.actor.name}
            />
          ) : (
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          )}
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-0.5">
            <NotificationIcon type={notification.type} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!notification.isRead && (
          <Button
            size="sm"
            variant="tertiary"
            isIconOnly
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            aria-label="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="tertiary"
          isIconOnly
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          aria-label="Delete notification"
          className="text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchNotifications();
  }, [isAuthenticated, router]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getAll(1, 50);
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const deletedNotification = notifications.find((n) => n.id === id);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50 dark:bg-red-950/30">
          <CardContent className="py-4 text-center">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : notifications.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              No notifications yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              When you get notifications, they'll show up here.
            </p>
          </CardContent>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
