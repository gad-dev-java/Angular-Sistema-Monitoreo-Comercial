// Mapea CompanyDto del backend
export interface CompanyDto {
  idCompany: number;
  name: string;
  ruc: string;
}

// Mapea CreateCompanyRequest
export interface CreateCompanyRequest {
  name: string;
  ruc: string;
}

// Mapea UpdateCompanyRequest
export interface UpdateCompanyRequest {
  name: string;
  ruc: string;

}
