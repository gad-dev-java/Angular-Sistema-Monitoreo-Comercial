import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { DataResponse } from '../models/Auth';
import { NotificationDto } from '../models/Notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/notifications`;

  getUnreadByStore(storeId: number): Observable<DataResponse<NotificationDto[]>> {
    return this.http.get<DataResponse<NotificationDto[]>>(`${this.base}/store/${storeId}`);
  }

  markAsRead(idNotification: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${idNotification}/read`, {});
  }

}
