import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { CreateUserRequest, UserDto } from '../models/User';
import { Observable } from 'rxjs';
import { DataResponse } from '../models/Auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/users`;

  create(request: CreateUserRequest): Observable<DataResponse<UserDto>> {
    return this.http.post<DataResponse<UserDto>>(this.base, request);
  }
}
