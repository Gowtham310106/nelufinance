// src/app/[locale]/(app)/expenses/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { ExpenseFormDialog } from "@/features/expenses/components/expense-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Calendar,
  Trash2,
  AlertCircle,
} from "lucide-react";

const EXPENSE_CATEGORIES = [
  "all",
  "transport",
  "loading",
  "unloading",
  "electricity",
  "salary",
  "rent",
  "maintenance",
  "food",
  "fuel",
  "other",
] as const;

export default function ExpensesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [category, setCategory] = useState("all");

  const { expenses, isLoading, isError, deleteExpense } = useExpenses({
    category: category === "all" ? undefined : category,
  });

  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm(t("expenses.deleteConfirm"))) return;
    setDeleteError("");
    try {
      await deleteExpense.mutateAsync(expenseId);
    } catch (err) {
      setDeleteError(err instanceof Error && err.message ? err.message : t("common.error"));
    }
  };

  const totalExpenseRupees =
    expenses.reduce((sum, e) => sum + e.amountPaise, 0) / 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("expenses.title")}</h2>
          <p className="text-sm text-muted-foreground">
            Total Spent:{" "}
            <span className="font-bold text-rose-600 rupee-display">
              ₹{totalExpenseRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <ExpenseFormDialog />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Select value={category} onValueChange={(val) => val && setCategory(val)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder={t("expenses.category")} />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === "all" ? t("common.all") : t(`expenses.categories.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {deleteError && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Expenses List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center text-destructive">{t("common.error")}</Card>
      ) : expenses.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Receipt className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("common.noData")}</p>
            <p className="text-sm text-muted-foreground">No expenses recorded for this period.</p>
          </div>
          <ExpenseFormDialog />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {expenses.map((expense) => {
            const dateStr = new Date(expense.date || expense.createdAt).toLocaleDateString(
              locale === "ta" ? "ta-IN" : "en-IN",
              { month: "short", day: "numeric", year: "numeric" }
            );

            const amtRupees = expense.amountPaise / 100;

            return (
              <Card key={expense._id} className="hover:shadow-xs transition-shadow">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {t(`expenses.categories.${expense.category}`)}
                      </Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {expense.transactionNumber}
                      </span>
                    </div>

                    {expense.notes && (
                      <p className="text-xs text-foreground font-medium truncate">
                        {expense.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateStr}
                      </span>
                      <span>•</span>
                      <span className="uppercase">{expense.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-bold text-rose-600 rupee-display">
                      ₹{amtRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(expense._id)}
                      aria-label={t("common.delete")}
                      disabled={deleteExpense.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
