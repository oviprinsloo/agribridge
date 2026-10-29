import prisma from '../config/database';

export class NotificationService {
  async sendNotification(params: {
    userId: string;
    title: string;
    message: string;
    type?: 'POOL' | 'MATCH' | 'ORDER' | 'PICKUP' | 'DELIVERY' | 'PAYMENT' | 'SCHEME' | 'DISPUTE' | 'SYSTEM';
    actionUrl?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'SYSTEM',
        actionUrl: params.actionUrl,
        read: false,
      },
    });
  }

  async notifyMultiple(
    userIds: string[],
    title: string,
    message: string,
    type: 'POOL' | 'MATCH' | 'ORDER' | 'PICKUP' | 'DELIVERY' | 'PAYMENT' | 'SCHEME' | 'DISPUTE' | 'SYSTEM' = 'SYSTEM',
    actionUrl?: string
  ) {
    if (userIds.length === 0) return;
    const notificationsData = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      actionUrl,
      read: false,
    }));

    return prisma.notification.createMany({
      data: notificationsData,
    });
  }
}

export const notificationService = new NotificationService();
