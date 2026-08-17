// src/features/seed/hooks/use-seed.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useSeed() {
  const queryClient = useQueryClient();

  const populateDemo = useMutation({
    mutationFn: async () => {
      const res = await api.post<{
        success: boolean;
        message: string;
        data: { summary: Record<string, number> };
      }>("/seed/demo", {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  return {
    populateDemo,
  };
}
