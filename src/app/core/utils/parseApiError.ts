import { HttpErrorResponse } from "@angular/common/http";
import { ErrorResponse } from '../models/error-response';

export function parseApiError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión.';
  }

  // El backend siempre devuelve ErrorResponse con { status, message, errors, ... }
  const body = err.error as ErrorResponse;

  if (!body) {
    return 'Ocurrió un error inesperado.';
  }

  // Si hay errores de validación (array de campos), los concatenamos
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return body.errors.join(' | ');
  }

  // Mensaje principal del backend (ej: "Invalid email or password")
  if (body.message) {
    return body.message;
  }

  return 'Ocurrió un error inesperado.';
}
