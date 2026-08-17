// src/app/[locale]/(app)/employees/page.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEmployees } from "@/features/employees/hooks/use-employees";
import { EmployeeFormDialog } from "@/features/employees/components/employee-form-dialog";
import { EmployeeAdvanceDialog } from "@/features/employees/components/employee-advance-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Phone, HandCoins, ArrowRight, UserCheck } from "lucide-react";

export default function EmployeesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { employees, isLoading, isError } = useEmployees();

  const totalAdvanceRupees =
    employees.reduce((sum, e) => sum + (e.currentAdvancePaise || 0), 0) / 100;

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("employees.title")}</h2>
          <p className="text-sm text-muted-foreground">
            Staff directory, wages & advance loan management
          </p>
        </div>
        <EmployeeFormDialog />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3.5 bg-muted/20">
          <span className="text-xs text-muted-foreground block">{t("employees.title")}</span>
          <span className="text-xl font-bold text-foreground">
            {employees.length} Active Staff
          </span>
        </Card>

        <Card className="p-3.5 bg-amber-500/10 border-amber-500/30">
          <span className="text-xs text-amber-800 dark:text-amber-300 block">Total Staff Advance</span>
          <span className="text-xl font-bold text-amber-600 rupee-display">
            ₹{totalAdvanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </Card>
      </div>

      {/* Staff Roster */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center text-destructive">{t("common.error")}</Card>
      ) : employees.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("common.noData")}</p>
            <p className="text-sm text-muted-foreground">No employees registered yet.</p>
          </div>
          <EmployeeFormDialog />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {employees.map((emp) => {
            const advanceRupees = (emp.currentAdvancePaise || 0) / 100;
            const baseWageRupees = (emp.baseSalaryPaise || 0) / 100;

            return (
              <Card key={emp._id} className="hover:shadow-xs transition-shadow">
                <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{emp.name}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {t(`employees.roles.${emp.role}` as any)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <a href={`tel:${emp.phone}`} className="flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3 w-3" />
                        <span>{emp.phone}</span>
                      </a>
                      <span>•</span>
                      <span>
                        Rate: ₹{baseWageRupees} / {t(`employees.salaryTypes.${emp.salaryType}` as any)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-muted-foreground block">
                        {t("employees.currentAdvance")}
                      </span>
                      <span
                        className={`font-bold text-sm rupee-display ${
                          advanceRupees > 0 ? "text-amber-600" : "text-success"
                        }`}
                      >
                        ₹{advanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <EmployeeAdvanceDialog employee={emp} />
                      <Link href={`/employees/${emp._id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
