import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/reports`;

  // El companyId ya viaja en el JWT — el backend lo extrae
  exportExcel(): Observable<Blob> {
    return this.http.get(`${this.base}/export`, {
      responseType: 'blob',
    });
  }

}
