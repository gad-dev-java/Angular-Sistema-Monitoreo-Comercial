import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { CreateSaleRequest, SaleDto } from '../models/Sale';
import { Observable } from 'rxjs';
import { DataResponse } from '../models/Auth';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/sales`;

  create(request: CreateSaleRequest): Observable<DataResponse<SaleDto>> {
    return this.http.post<DataResponse<SaleDto>>(this.base, request);
  }
}
