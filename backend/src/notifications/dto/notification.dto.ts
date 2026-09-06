import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../notification.entity.js';

export class NotificationDto {
  @ApiProperty({ description: 'Notification unique identifier' })
  id: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty({ description: 'User who triggered the notification' })
  actor: {
    id: string;
    name: string;
    profilePicture: string | null;
  };

  @ApiProperty({ description: 'ID of the target resource (post or comment)' })
  targetId: string;

  @ApiProperty({ description: 'Comment ID if applicable', required: false })
  commentId: string | null;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({ description: 'Whether the notification has been read' })
  isRead: boolean;

  @ApiProperty({ description: 'When the notification was created' })
  createdAt: Date;
}

export class NotificationListDto {
  @ApiProperty({ type: [NotificationDto] })
  data: NotificationDto[];

  @ApiProperty({ description: 'Total count of notifications' })
  total: number;

  @ApiProperty({ description: 'Count of unread notifications' })
  unreadCount: number;
}
