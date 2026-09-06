import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { NotificationListDto } from './dto/notification.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { User } from '../users/user.entity.js';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications', description: '🔒 Requires authentication. Returns paginated list of notifications with related post/comment info.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully with pagination metadata', type: NotificationListDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<NotificationListDto> {
    return this.notificationsService.getNotifications(user.id, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count', description: '🔒 Requires authentication. Returns count of unread notifications for the current user.' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully', schema: { properties: { count: { type: 'number' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as read', description: '🔒 Requires authentication and ownership. Marks a single notification as read.' })
  @ApiParam({ name: 'id', description: 'Notification UUID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the notification owner' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    await this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read', description: '🔒 Requires authentication. Marks all user notifications as read.' })
  @ApiResponse({ status: 204, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@CurrentUser() user: User): Promise<void> {
    await this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification', description: '🔒 Requires authentication and ownership. Permanently deletes a notification.' })
  @ApiParam({ name: 'id', description: 'Notification UUID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the notification owner' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    await this.notificationsService.deleteNotification(id, user.id);
  }
}
