// src/app/[locale]/(app)/audit-logs/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuditLogs } from "@/features/audit/hooks/use-audit-logs";
import { Card } from "@/components/ui/card";
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
import { ShieldCheck, User, Calendar, RefreshCw } from "lucide-react";

const ENTITY_TYPES = [
  "all",
  "Product",
  "Customer",
  "Supplier",
  "Sale",
  "Purchase",
  "Payment",
  "Expense",
  "DailyClosing",
  "WeightReconciliation",
  "Employee",
  "EmployeeAdvance",
  "AdakuKadan",
  "AdakuPayment",
] as const;

export default function AuditLogsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [entityType, setEntityType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { logs, pagination, isLoading, isError, refetch } = useAuditLogs({
    entityType: entityType === "all" ? undefined : entityType,
    page,
  });
  const totalPages = pagination?.pages ?? 1;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("nav.auditLogs")}</h2>
          <p className="text-sm text-muted-foreground">
            Immutable system audit trail tracking all business actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={entityType} onValueChange={(val) => { if (val) { setEntityType(val); setPage(1); } }}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="Filter by Entity" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((et) => (
                <SelectItem key={et} value={et}>
                  {et === "all" ? "All Activities" : et}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Logs Timeline */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center text-destructive">{t("common.error")}</Card>
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="font-medium text-sm">No audit logs recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {pagination && totalPages > 1 && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Page {page} of {totalPages} • {pagination.total} entries
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹ Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next ›
                </Button>
              </div>
            </div>
          )}
          {logs.map((log) => {
            const dateStr = new Date(log.createdAt).toLocaleDateString(
              locale === "ta" ? "ta-IN" : "en-IN",
              { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }
            );

            return (
              <Card key={log._id} className="p-3.5 hover:shadow-xs transition-shadow">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-primary">
                        {log.action}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {log.entityType}
                      </Badge>
                      {log.userId?.name && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userId.name}
                        </span>
                      )}
                    </div>

                    {log.reason && (
                      <p className="text-sm font-medium text-foreground">
                        {log.reason}
                      </p>
                    )}

                    {log.changes && log.changes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {log.changes.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-muted/60 text-[10px] font-mono">
                            {c.field}: {String(c.oldValue ?? "null")} → {String(c.newValue ?? "null")}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
                      <Calendar className="h-3 w-3" />
                      {dateStr}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
