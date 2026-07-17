"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CREATE_VENDOR_INVOICE_RECORDS_WIDGET_NAME } from "@/widgets/create-vendor-invoice-records";
import type { CreateVendorInvoiceRecordsResult } from "@/widgets/create-vendor-invoice-records/types";
import type { WidgetOpenContext } from "@/widgets/types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function buildYearOptions(centerYear: number) {
  const start = centerYear - 5;
  const end = centerYear + 5;
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) {
    years.push(year);
  }
  return years;
}

type CreateVendorInvoiceRecordsWidgetProps = WidgetOpenContext & {
  open: boolean;
  onClose: () => void;
  className?: string;
};

/**
 * UI for the "Create Vendor Invoice records" widget
 * (opened from the "Create No Invoice Needed" list action).
 * Submit calls Zoho CRM function `create_vendor_invoice_through_widget`.
 */
export function CreateVendorInvoiceRecordsWidget({
  open,
  onClose,
  selectedRecordIds,
  module = "Contracts",
  className,
}: CreateVendorInvoiceRecordsWidgetProps) {
  const titleId = useId();
  const monthId = useId();
  const yearId = useId();
  const now = useMemo(() => new Date(), []);
  const years = useMemo(() => buildYearOptions(now.getFullYear()), [now]);

  const [monthOfService, setMonthOfService] = useState(
    () => MONTHS[now.getMonth()] ?? "July",
  );
  const [yearOfService, setYearOfService] = useState(() => now.getFullYear());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateVendorInvoiceRecordsResult | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;

    setMonthOfService(MONTHS[now.getMonth()] ?? "July");
    setYearOfService(now.getFullYear());
    setSubmitting(false);
    setError(null);
    setResult(null);
  }, [open, now]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, submitting]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    if (!monthOfService || !yearOfService) {
      setError("Please select both month and year.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/widgets/create-vendor-invoice-records",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedRecordIds,
            module,
            monthOfService,
            yearOfService,
          }),
        },
      );

      const data = (await response
        .json()
        .catch(() => ({}))) as CreateVendorInvoiceRecordsResult;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message || "There was an error processing your request.",
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ?
          err.message
        : "There was an error processing your request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectClassName = cn(
    "h-10 w-full appearance-none rounded-lg border border-crm-border bg-crm-panel px-3 pr-9 text-sm text-crm-text",
    "outline-none transition",
    "hover:border-blue-400/70 hover:bg-crm-panel-muted",
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25",
    "dark:hover:border-blue-500/50 dark:focus:ring-blue-400/30",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "bg-[length:0.7rem] bg-[right_0.75rem_center] bg-no-repeat",
    "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27 fill=%27%2371717a%27%3E%3Cpath d=%27M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z%27/%3E%3C/svg%3E')]",
    "dark:bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27 fill=%27%23a1a1aa%27%3E%3Cpath d=%27M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z%27/%3E%3C/svg%3E')]",
  );

  const showResults = Boolean(result?.ok);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-[2px] dark:bg-black/60"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={submitting}
        className={cn(
          "relative w-full max-w-[28rem] overflow-hidden rounded-2xl border border-crm-border bg-crm-panel shadow-xl shadow-zinc-950/15",
          "dark:shadow-black/50",
          className,
        )}
      >
        {submitting ?
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-crm-panel/85 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="size-10 animate-spin text-blue-600 dark:text-blue-400"
              aria-hidden
            />
            <p className="text-sm font-medium text-crm-text">
              Creating vendor invoice records…
            </p>
          </div>
        : null}

        <header className="flex items-start justify-between gap-3 border-b border-crm-border bg-crm-panel-muted/80 px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="page-heading truncate text-base sm:text-lg"
            >
              {CREATE_VENDOR_INVOICE_RECORDS_WIDGET_NAME}
            </h2>
            <p className="mt-1 text-sm text-crm-text-muted">
              {selectedRecordIds.length.toLocaleString("en-US")} contract
              {selectedRecordIds.length === 1 ? "" : "s"} selected
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="crm-toolbar-btn shrink-0"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </header>

        {showResults && result ?
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <h3 className="section-heading mb-4 text-[0.95rem]">
              {result.hasCounts ? "Execution Result" : "Success"}
            </h3>

            {result.hasCounts ?
              <>
                <div className="overflow-hidden rounded-xl border border-crm-border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-crm-panel-muted text-crm-text">
                      <tr>
                        <th className="border-b border-crm-border px-3 py-2 text-left font-semibold">
                          Record Created
                        </th>
                        <th className="border-b border-crm-border px-3 py-2 text-left font-semibold">
                          Record Not Created
                        </th>
                        <th className="border-b border-crm-border px-3 py-2 text-left font-semibold">
                          Duplicates
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-crm-text">
                        <td className="px-3 py-2.5">
                          {result.recordCreated ?? 0}
                        </td>
                        <td className="px-3 py-2.5">
                          {result.recordNotCreated ?? 0}
                        </td>
                        <td className="px-3 py-2.5">
                          {result.duplicateCount ?? 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {result.errors && result.errors.length > 0 ?
                  <div className="mt-3 max-h-48 overflow-auto rounded-xl border border-crm-border bg-crm-panel-muted/60 px-3 py-2 text-left text-sm text-crm-text">
                    <strong className="text-crm-text">Errors:</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-crm-text-muted">
                      {result.errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                : null}
              </>
            : <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                {result.message || "Vendor has been created successfully"}
              </p>
            }

            <Button
              type="button"
              className="mt-5 h-10 w-full bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
              onClick={onClose}
            >
              OK
            </Button>
          </div>
        : <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-5 rounded-xl border border-crm-border/80 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent px-4 py-3 dark:from-blue-400/15 dark:via-blue-400/5">
              <h3 className="section-heading text-[0.95rem]">
                Select Service Details
              </h3>
              <p className="mt-0.5 text-xs text-crm-text-muted">
                Choose the service period for the selected contracts.
              </p>
            </div>

            <div className="mx-auto flex w-full max-w-[18rem] flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={monthId}
                  className="text-sm font-medium text-crm-text"
                >
                  Month of Service <span className="text-red-500">*</span>
                </label>
                <select
                  id={monthId}
                  required
                  value={monthOfService}
                  disabled={submitting}
                  onChange={(event) => setMonthOfService(event.target.value)}
                  className={selectClassName}
                >
                  <option value="">-- Select Month --</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={yearId}
                  className="text-sm font-medium text-crm-text"
                >
                  Year of Service <span className="text-red-500">*</span>
                </label>
                <select
                  id={yearId}
                  required
                  value={yearOfService}
                  disabled={submitting}
                  onChange={(event) =>
                    setYearOfService(Number.parseInt(event.target.value, 10))
                  }
                  className={selectClassName}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {error ?
                <p
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
                  role="alert"
                >
                  {error}
                </p>
              : null}

              <button
                type="submit"
                disabled={submitting || selectedRecordIds.length === 0}
                className={cn(
                  "mt-1 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium text-white transition",
                  "bg-blue-600 hover:bg-blue-500",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-crm-panel",
                  "dark:bg-blue-500 dark:hover:bg-blue-400",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                Submit
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  );
}
