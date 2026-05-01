export type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export type ApiErrorPayload = {
  message?: string;
  code?: string;
};

export type ApiListEnvelope<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.code = options?.code;
  }
}
