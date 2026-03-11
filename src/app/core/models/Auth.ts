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
  sub: string;       // email
  email: string;
  name: string;
  idCompany: number;
  roles: string[];
  iat: number;
  exp: number;
}








