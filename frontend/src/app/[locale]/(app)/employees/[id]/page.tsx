// src/app/[locale]/(app)/employees/[id]/page.tsx
"use client";

import { use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEmployees } from "@/features/employees/hooks/use-employees";
import { EmployeeAdvanceDialog } from "@/features/employees/components/employee-advance-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, Calendar, Printer, HandCoins } from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { useEmployeeDetail } = useEmployees();
  const { data, isLoading } = useEmployeeDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data?.employee) {
    return (
      <div className="text-center p-12 space-y-3">
        <p className="text-destructive font-semibold">Employee not found</p>
        <Button variant="outline" onClick={() => router.push("/employees")}>
          Back to Employees
        </Button>
      </div>
    );
  }

  const { employee, transactions } = data;
  const advanceRupees = (employee.currentAdvancePaise || 0) / 100;
  const baseWageRupees = (employee.baseSalaryPaise || 0) / 100;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="h-4 w-4" />
          Print Statement
        </Button>
      </div>

      {/* Employee Profile Card */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <Badge variant="secondary" className="capitalize">
                  {t(`employees.roles.${employee.role}` as any)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <a href={`tel:${employee.phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{employee.phone}</span>
                </a>
                <span>•</span>
                <span>
                  Rate: ₹{baseWageRupees} / {t(`employees.salaryTypes.${employee.salaryType}` as any)}
                </span>
              </div>
            </div>

            <EmployeeAdvanceDialog employee={employee} />
          </div>

          {/* KPI */}
          <div className="p-3 bg-muted/40 rounded-lg flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{t("employees.currentAdvance")}</span>
            <span
              className={`text-lg font-bold rupee-display ${
                advanceRupees > 0 ? "text-amber-600" : "text-success"
              }`}
            >
              ₹{advanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Advance / Salary History */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Transaction History ({transactions.length})</h3>

        {transactions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            No salary or advance transactions recorded yet.
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => {
              const dateStr = new Date(txn.date).toLocaleDateString(
                locale === "ta" ? "ta-IN" : "en-IN",
                { month: "short", day: "numeric", year: "numeric" }
              );

              const isAdvanceGiven = txn.type === "ADVANCE_GIVEN";
              const isSalaryPaid = txn.type === "SALARY_PAID";
              const isAdvanceDeducted = txn.type === "ADVANCE_DEDUCTED";

              return (
                <Card key={txn._id} className="p-3.5 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isAdvanceGiven ? "default" : isSalaryPaid ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {isAdvanceGiven
                            ? "Advance Given"
                            : isSalaryPaid
                            ? "Salary Disbursed"
                            : "Advance Deducted"}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {txn.transactionNumber}
                        </span>
                      </div>

                      {txn.notes && <p className="text-foreground text-xs">{txn.notes}</p>}

                      <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateStr} • {txn.paymentMethod.toUpperCase()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold text-sm rupee-display ${
                          isAdvanceGiven ? "text-amber-600" : isSalaryPaid ? "text-foreground" : "text-success"
                        }`}
                      >
                        ₹{(txn.amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
