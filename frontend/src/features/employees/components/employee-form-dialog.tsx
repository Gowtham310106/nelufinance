// src/features/employees/components/employee-form-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEmployees, Employee } from "../hooks/use-employees";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";

interface EmployeeFormDialogProps {
  employee?: Employee;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

const ROLES = ["manager", "cashier", "labor", "driver", "helper"] as const;
const SALARY_TYPES = ["daily", "monthly", "per_bag"] as const;

export function EmployeeFormDialog({ employee, trigger, onSuccess }: EmployeeFormDialogProps) {
  const t = useTranslations();
  const { createEmployee, updateEmployee } = useEmployees();
  const [open, setOpen] = useState(false);

  const isEditing = !!employee;

  const [name, setName] = useState(employee?.name || "");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [role, setRole] = useState<string>(employee?.role || "labor");
  const [salaryType, setSalaryType] = useState<string>(employee?.salaryType || "daily");
  const [baseSalaryRupees, setBaseSalaryRupees] = useState(
    employee ? (employee.baseSalaryPaise / 100).toString() : ""
  );
  const [notes, setNotes] = useState(employee?.notes || "");
  const [error, setError] = useState("");

  const isSubmitting = createEmployee.isPending || updateEmployee.isPending;

  // Seed the form from the entity (edit mode) or blank defaults (create mode).
  const resetForm = () => {
    setName(employee?.name || "");
    setPhone(employee?.phone || "");
    setRole(employee?.role || "labor");
    setSalaryType(employee?.salaryType || "daily");
    setBaseSalaryRupees(employee ? (employee.baseSalaryPaise / 100).toString() : "");
    setNotes(employee?.notes || "");
    setError("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) resetForm();
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError(t("validation.required"));
      return;
    }

    const payload = {
      name,
      phone,
      role,
      salaryType,
      baseSalaryPaise: Math.round(parseFloat(baseSalaryRupees || "0") * 100),
      notes,
    };

    try {
      if (isEditing) {
        await updateEmployee.mutateAsync({ id: employee._id, data: payload });
      } else {
        await createEmployee.mutateAsync(payload);
        resetForm();
      }

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Failed to save employee");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button className="gap-1.5" />}>
          <UserPlus className="h-4 w-4" />
          {t("employees.addEmployee")}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("employees.editEmployee") : t("employees.addEmployee")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="emp-name">{t("common.name")} *</Label>
            <Input
              id="emp-name"
              placeholder="e.g. Ramesh / Selvam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp-phone">{t("common.phone")} *</Label>
            <Input
              id="emp-phone"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("employees.role")}</Label>
              <Select value={role} onValueChange={(val) => val && setRole(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`employees.roles.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("employees.salaryType")}</Label>
              <Select value={salaryType} onValueChange={(val) => val && setSalaryType(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_TYPES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {t(`employees.salaryTypes.${st}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp-base">{t("employees.baseSalary")} (₹)</Label>
            <Input
              id="emp-base"
              type="number"
              placeholder="e.g. 500 (Daily) or 15000 (Monthly)"
              value={baseSalaryRupees}
              onChange={(e) => setBaseSalaryRupees(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp-notes">{t("common.notes")}</Label>
            <Input
              id="emp-notes"
              placeholder="Optional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("common.save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
