export interface NotificationDto {
  idNotification: number;
  storeId: number;
  storeName?: string;
  message: string;
  type: 'CRITICAL' | 'WARNING' | 'OK' | string;
  read: boolean;
  createdAt?: string;
}
