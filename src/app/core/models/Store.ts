export interface StoreDto {
  idStore: number;
  name: string;
  address: string;
  city: string;
  companyName: string;
}

export interface CreateStoreRequest {
  name: string;
  address: string;
  city: string;
  companyName: string;
}

export interface UpdateStoreRequest {
  name: string;
  address: string;
  city: string;
  companyName: string;
}
