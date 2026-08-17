// src/utils/api-response.ts

import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
  const response: ApiResponse<T> = { success: true, data };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, statusCode: number = 400) {
  const response: ApiResponse = { success: false, error: message };
  return res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
) {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(200).json(response);
}
