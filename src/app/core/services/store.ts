import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { CreateStoreRequest, StoreDto, UpdateStoreRequest } from '../models/Store';
import { Observable } from 'rxjs';
import { DataResponse } from '../models/Auth';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/stores`;

  getByCompany(companyId: number): Observable<DataResponse<StoreDto[]>> {
    return this.http.get<DataResponse<StoreDto[]>>(`${this.base}/company/${companyId}`);
  }

  create(request: CreateStoreRequest): Observable<DataResponse<StoreDto>> {
    return this.http.post<DataResponse<StoreDto>>(this.base, request);
  }

  update(id: number, request: UpdateStoreRequest): Observable<DataResponse<StoreDto>> {
    return this.http.put<DataResponse<StoreDto>>(`${this.base}/${id}`, request);
  }
}
