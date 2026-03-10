import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { CreateSalesObjectiveRequest, SalesObjectiveDto } from '../models/Objective';
import { Observable } from 'rxjs';
import { DataResponse } from '../models/Auth';

@Injectable({
  providedIn: 'root'
})
export class ObjectiveService {
private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/sales-objectives`;

  create(request: CreateSalesObjectiveRequest): Observable<DataResponse<SalesObjectiveDto>> {
    return this.http.post<DataResponse<SalesObjectiveDto>>(this.base, request);
  }
}
