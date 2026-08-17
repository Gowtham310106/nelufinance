// src/features/employees/hooks/use-employees.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Employee {
  _id: string;
  name: string;
  phone: string;
  role: "manager" | "cashier" | "labor" | "driver" | "helper";
  salaryType: "daily" | "monthly" | "per_bag";
  baseSalaryPaise: number;
  currentAdvancePaise: number;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface EmployeeTransaction {
  _id: string;
  transactionNumber: string;
  employeeId: string;
  employeeName: string;
  type: "ADVANCE_GIVEN" | "SALARY_PAID" | "ADVANCE_DEDUCTED";
  amountPaise: number;
  paymentMethod: string;
  notes?: string;
  date: string;
}

export interface CreateEmployeeInput {
  name: string;
  phone: string;
  role: string;
  salaryType: string;
  baseSalaryPaise: number;
  notes?: string;
}

export interface RecordEmployeeTransactionInput {
  type: "ADVANCE_GIVEN" | "SALARY_PAID" | "ADVANCE_DEDUCTED";
  amountPaise: number;
  paymentMethod: string;
  notes?: string;
  date?: string;
}

export function useEmployees() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Employee[] }>("/employees");
      return res.data;
    },
  });

  const useEmployeeDetail = (employeeId: string) =>
    useQuery({
      queryKey: ["employee", employeeId],
      queryFn: async () => {
        const res = await api.get<{
          success: boolean;
          data: { employee: Employee; transactions: EmployeeTransaction[] };
        }>(`/employees/${employeeId}`);
        return res.data;
      },
      enabled: !!employeeId,
    });

  const createEmployee = useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
      const res = await api.post<{ success: boolean; data: Employee }>("/employees", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const recordTransaction = useMutation({
    mutationFn: async ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: RecordEmployeeTransactionInput;
    }) => {
      const res = await api.post<{ success: boolean; data: EmployeeTransaction }>(
        `/employees/${employeeId}/transactions`,
        data
      );
      return res.data;
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    employees: listQuery.data || [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    useEmployeeDetail,
    createEmployee,
    recordTransaction,
  };
}
