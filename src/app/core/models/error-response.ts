// Mapea exactamente el ErrorResponse del backend
export interface ErrorResponse {
  status: number;
  message: string;
  errors: string[] | null;
  timestamp: string;
  path: string;
}
