export interface NotificationDto {
  idNotification: number;
  nameStore: string;       // nombre del local directo
  alertType: string;       // "ALERTA"
  severityLevel: string;   // "CRITICAL" | "WARNING" | "OK"
  message: string;
  isRead: boolean;
}
