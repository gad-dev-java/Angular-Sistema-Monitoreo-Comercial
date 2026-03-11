import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, AuthUser, DataResponse } from '../models/Auth';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly TOKEN_KEY = 'auth_token';

  login(request: AuthRequest): Observable<DataResponse<AuthResponse>> {
    return this.http
      .post<DataResponse<AuthResponse>>(`${environment.apiUrl}/api/auth/login`, request)
      .pipe(tap(res => this.saveToken(res.data.token)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getUser(): AuthUser | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return this.decodeToken(token);
    } catch {
      return null;
    }
  }

  /** Shortcut — idCompany del usuario logueado */
  getCompanyId(): number | null {
    return this.getUser()?.idCompany ?? null;
  }

  /** Shortcut — roles del usuario logueado */
  getRoles(): string[] {
    return this.getUser()?.roles ?? [];
  }

  isAdmin(): boolean {
    return this.getRoles().includes('ROLE_ADMIN');
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private decodeToken(token: string): AuthUser {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as AuthUser;
  }
}
