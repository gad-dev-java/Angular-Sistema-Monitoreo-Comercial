import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, AuthUser, DataResponse } from '../models/Auth';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /**
   * Llama a POST /api/auth/login y guarda el JWT en localStorage.
   */
  login(credentials: AuthRequest): Observable<DataResponse<AuthResponse>> {
    return this.http
      .post<DataResponse<AuthResponse>>(
        `${environment.apiUrl}/api/auth/login`,
        credentials
      )
      .pipe(
        tap((response) => {
          if (response?.data?.token) {
            this.saveToken(response.data.token);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  // ─── Token helpers ────────────────────────────────────────────────────────

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodePayload(token);
      // Verificar expiración (exp está en segundos)
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getUser(): AuthUser | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return this.decodePayload(token) as AuthUser;
    } catch {
      return null;
    }
  }

  // ─── Decodificación del JWT (sin librerías externas) ──────────────────────

  private decodePayload(token: string): AuthUser {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}
