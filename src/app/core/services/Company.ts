import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { CompanyDto, CreateCompanyRequest, UpdateCompanyRequest } from '../models/Company';
import { Observable } from 'rxjs';
import { DataResponse } from '../models/Auth';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/companies`;

  create(request: CreateCompanyRequest): Observable<DataResponse<CompanyDto>> {
    return this.http.post<DataResponse<CompanyDto>>(this.base, request);
  }

  update(id: number, request: UpdateCompanyRequest): Observable<DataResponse<CompanyDto>> {
    return this.http.put<DataResponse<CompanyDto>>(`${this.base}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
