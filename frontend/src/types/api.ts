export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
