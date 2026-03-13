import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '../services/Auth';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Identificamos si es una petición de login
  const isLoginRequest = req.url.includes('/api/auth/login');

  // 2. Si es login, limpiamos el storage para no enviar basura al backend
  if (isLoginRequest) {
    localStorage.clear();
  }

  const token = authService.getToken();

  // 3. Solo adjuntamos el token si existe y NO es una petición de login
  const authReq = (token && !isLoginRequest)
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLoginRequest) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
