export interface SaleDto {
  idSale: number;
  storeName: string;
  amount: number;
  description: string;
  createdAt?: string;
}

export interface CreateSaleRequest {
  storeName: string;
  amount: number;
  description: string;
}
