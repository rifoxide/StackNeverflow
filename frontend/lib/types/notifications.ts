export interface Notification {
  id: string;
  type: 'post_reaction' | 'post_comment' | 'comment_reaction' | 'comment_reply';
  actor: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  targetId: string;
  commentId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  data: Notification[];
  total: number;
  unreadCount: number;
}
