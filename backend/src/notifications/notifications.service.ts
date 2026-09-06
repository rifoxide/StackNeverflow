import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity.js';
import { NotificationDto, NotificationListDto } from './dto/notification.dto.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  /**
   * Create a notification for a post reaction.
   */
  async createPostReactionNotification(
    postId: string,
    postAuthorId: string,
    actorId: string,
    actorName: string,
    reactionType: 'like' | 'dislike',
  ): Promise<void> {
    // Don't notify users about their own reactions
    if (postAuthorId === actorId) {
      return;
    }

    const message = `${actorName} ${reactionType === 'like' ? 'liked' : 'disliked'} your post`;

    await this.notificationsRepository.save({
      type: NotificationType.POST_REACTION,
      recipientId: postAuthorId,
      actorId,
      targetId: postId,
      commentId: null,
      message,
      isRead: false,
    });
  }

  /**
   * Create a notification for a comment on a post.
   */
  async createPostCommentNotification(
    postId: string,
    postAuthorId: string,
    actorId: string,
    actorName: string,
    commentId: string,
  ): Promise<void> {
    // Don't notify users about their own comments
    if (postAuthorId === actorId) {
      return;
    }

    const message = `${actorName} commented on your post`;

    await this.notificationsRepository.save({
      type: NotificationType.POST_COMMENT,
      recipientId: postAuthorId,
      actorId,
      targetId: postId,
      commentId,
      message,
      isRead: false,
    });
  }

  /**
   * Create a notification for a comment reaction.
   */
  async createCommentReactionNotification(
    commentId: string,
    commentAuthorId: string,
    actorId: string,
    actorName: string,
    reactionType: 'like' | 'dislike',
    postId: string,
  ): Promise<void> {
    // Don't notify users about their own reactions
    if (commentAuthorId === actorId) {
      return;
    }

    const message = `${actorName} ${reactionType === 'like' ? 'liked' : 'disliked'} your comment`;

    await this.notificationsRepository.save({
      type: NotificationType.COMMENT_REACTION,
      recipientId: commentAuthorId,
      actorId,
      targetId: postId,
      commentId,
      message,
      isRead: false,
    });
  }

  /**
   * Create a notification for a reply to a comment.
   */
  async createCommentReplyNotification(
    parentCommentAuthorId: string,
    actorId: string,
    actorName: string,
    replyCommentId: string,
    postId: string,
  ): Promise<void> {
    // Don't notify users about their own replies
    if (parentCommentAuthorId === actorId) {
      return;
    }

    const message = `${actorName} replied to your comment`;

    await this.notificationsRepository.save({
      type: NotificationType.COMMENT_REPLY,
      recipientId: parentCommentAuthorId,
      actorId,
      targetId: postId,
      commentId: replyCommentId,
      message,
      isRead: false,
    });
  }

  /**
   * Get all notifications for a user.
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<NotificationListDto> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: { recipientId: userId },
      relations: { actor: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    const unreadCount = await this.notificationsRepository.count({
      where: { recipientId: userId, isRead: false },
    });

    const data: NotificationDto[] = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      actor: {
        id: n.actor.id,
        name: n.actor.name,
        profilePicture: n.actor.profilePicture,
      },
      targetId: n.targetId,
      commentId: n.commentId,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    return { data, total, unreadCount };
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { id: notificationId, recipientId: userId },
      { isRead: true },
    );
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  /**
   * Delete a notification.
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepository.delete({
      id: notificationId,
      recipientId: userId,
    });
  }
}
