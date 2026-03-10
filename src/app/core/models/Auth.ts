export interface AuthRequest {
  email: string;
  password: string;
}

export interface DataResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}


export interface AuthResponse {
  token: string;
}


export interface AuthUser {
  email: string;
  roles: string[];
  exp: number;
  iat: number;
}
