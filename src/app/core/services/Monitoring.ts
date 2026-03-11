import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { DataResponse } from '../models/Auth';
import { MonitoringKpiResponse } from '../models/Monitoring';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/monitoring`;

  getKpi(storeId: number): Observable<DataResponse<MonitoringKpiResponse>> {
    return this.http.get<DataResponse<MonitoringKpiResponse>>(`${this.base}/kpi/${storeId}`);
  }
}
