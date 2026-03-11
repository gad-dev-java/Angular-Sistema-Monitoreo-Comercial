export interface UserDto {
  idUser: number;
  name: string;
  email: string;
  role: string;
  companyName: string;
  companyStatus: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  companyName: string;
}
