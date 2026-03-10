export interface SalesObjectiveDto {
  idObjective: number;
  nameStore: string;
  targetAmount: number;
  periodType: string;
  startDate: string;
  endDate: string;
}

export interface CreateSalesObjectiveRequest {
  nameStore: string;
  targetAmount: number;
  periodType: string;
  startDate: string;  // ISO: 'YYYY-MM-DD'
  endDate: string;
}
