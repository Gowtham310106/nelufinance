// src/features/audit/hooks/use-audit-logs.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AuditLogItem {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    phone: string;
    role: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  reason?: string;
  timestamp: string;
}

export function useAuditLogs(options: { entityType?: string; action?: string } = {}) {
  const query = useQuery({
    queryKey: ["audit-logs", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.entityType && options.entityType !== "all") {
        params.append("entityType", options.entityType);
      }
      if (options.action && options.action !== "all") {
        params.append("action", options.action);
      }

      const endpoint = `/audit-logs${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{
        success: boolean;
        data: {
          logs: AuditLogItem[];
          pagination: { total: number; page: number; limit: number; pages: number };
        };
      }>(endpoint);
      return res.data;
    },
  });

  return {
    logs: query.data?.logs || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
