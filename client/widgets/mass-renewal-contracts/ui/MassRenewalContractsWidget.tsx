"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MASS_RENEWAL_CONTRACTS_WIDGET_NAME } from "@/widgets/mass-renewal-contracts";
import type {
  MassRenewalContractsFormValues,
  MassRenewalContractsResult,
  MassRenewalResultItem,
} from "@/widgets/mass-renewal-contracts/types";
import type { WidgetOpenContext } from "@/widgets/types";

const EMPTY_FORM: MassRenewalContractsFormValues = {
  clientBidDue: "",
  vendorBidDue: "",
  yearsOfExtension: "1",
  clientAddendum: "",
  vendorAddendum: "",
  internalNotes: "",
};

type MassRenewalContractsWidgetProps = WidgetOpenContext & {
  open: boolean;
  onClose: () => void;
  className?: string;
};

const labelClassName =
  "mb-1.5 block text-sm font-medium text-crm-text-muted";

const inputClassName = cn(
  "h-10 w-full rounded-lg border border-crm-border bg-crm-panel px-3 text-sm text-crm-text",
  "outline-none transition",
  "placeholder:text-crm-text-muted/70",
  "hover:border-blue-400/70 hover:bg-crm-panel-muted",
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

const textareaClassName = cn(
  "min-h-[5.5rem] w-full resize-y rounded-lg border border-crm-border bg-crm-panel px-3 py-2 text-sm text-crm-text",
  "outline-none transition",
  "placeholder:text-crm-text-muted/70",
  "hover:border-blue-400/70 hover:bg-crm-panel-muted",
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

/**
 * “Mass Renewal Contracts” — Create SOW UI + results (port of logic/widget).
 */
export function MassRenewalContractsWidget({
  open,
  onClose,
  selectedRecordIds,
  module = "Contracts",
  className,
}: MassRenewalContractsWidgetProps) {
  const titleId = useId();
  const clientBidDueId = useId();
  const vendorBidDueId = useId();
  const yearsId = useId();
  const clientAddendumId = useId();
  const vendorAddendumId = useId();
  const notesId = useId();

  const [form, setForm] = useState<MassRenewalContractsFormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MassRenewalContractsResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [openSnapshot, setOpenSnapshot] = useState(false);
  if (open !== openSnapshot) {
    setOpenSnapshot(open);
    if (open) {
      setForm(EMPTY_FORM);
      setSubmitting(false);
      setError(null);
      setResult(null);
      setShowResults(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        if (showResults) setShowResults(false);
        else onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, submitting, showResults]);

  if (!open) return null;

  function updateField<K extends keyof MassRenewalContractsFormValues>(
    key: K,
    value: MassRenewalContractsFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setShowResults(false);

    if (selectedRecordIds.length === 0) {
      setError("Select at least one contract.");
      return;
    }

    if (!form.clientBidDue.trim() || !form.vendorBidDue.trim()) {
      setError("Please provide both Client and Vendor Bid Due Dates");
      return;
    }

    const years = Number(form.yearsOfExtension);
    if (!Number.isFinite(years) || years <= 0) {
      setError("Years of Extension must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/widgets/mass-renewal-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRecordIds,
          module,
          clientBidDue: form.clientBidDue,
          vendorBidDue: form.vendorBidDue,
          yearsOfExtension: String(years),
          clientAddendum: form.clientAddendum,
          vendorAddendum: form.vendorAddendum,
          internalNotes: form.internalNotes,
        }),
      });

      const data = (await response.json().catch(
        () => ({}),
      )) as MassRenewalContractsResult;

      if (!response.ok && !data.results?.length) {
        throw new Error(data.message || "Failed to create SOW.");
      }

      setResult(data);
      setForm(EMPTY_FORM);
      if (data.results?.length) setShowResults(true);
      else if (!data.ok) {
        setError(data.message || "Failed to create SOW.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create SOW.");
    } finally {
      setSubmitting(false);
    }
  }

  const results = result?.results ?? [];

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
          "relative w-full max-w-[36rem] overflow-hidden rounded-2xl border border-crm-border bg-crm-panel shadow-xl",
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
              className="size-10 animate-spin text-blue-600"
              aria-hidden
            />
            <p className="text-sm font-medium text-crm-text">Processing…</p>
          </div>
        : null}

        <header className="flex items-start justify-between gap-3 border-b border-crm-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="page-heading truncate text-base sm:text-lg"
            >
              {MASS_RENEWAL_CONTRACTS_WIDGET_NAME}
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

        <form
          onSubmit={handleSubmit}
          className="flex max-h-[min(80vh,40rem)] flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={clientBidDueId} className={labelClassName}>
                Client Bid Due
              </label>
              <input
                id={clientBidDueId}
                type="date"
                value={form.clientBidDue}
                onChange={(event) =>
                  updateField("clientBidDue", event.target.value)
                }
                disabled={submitting}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor={vendorBidDueId} className={labelClassName}>
                Vendor Bid Due
              </label>
              <input
                id={vendorBidDueId}
                type="date"
                value={form.vendorBidDue}
                onChange={(event) =>
                  updateField("vendorBidDue", event.target.value)
                }
                disabled={submitting}
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor={yearsId} className={labelClassName}>
              Years of Extension
            </label>
            <input
              id={yearsId}
              type="number"
              min={1}
              step={1}
              value={form.yearsOfExtension}
              onChange={(event) =>
                updateField("yearsOfExtension", event.target.value)
              }
              disabled={submitting}
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={clientAddendumId} className={labelClassName}>
                Client Addendum
              </label>
              <textarea
                id={clientAddendumId}
                value={form.clientAddendum}
                onChange={(event) =>
                  updateField("clientAddendum", event.target.value)
                }
                disabled={submitting}
                className={textareaClassName}
                rows={4}
              />
            </div>
            <div>
              <label htmlFor={vendorAddendumId} className={labelClassName}>
                Vendor Addendum
              </label>
              <textarea
                id={vendorAddendumId}
                value={form.vendorAddendum}
                onChange={(event) =>
                  updateField("vendorAddendum", event.target.value)
                }
                disabled={submitting}
                className={textareaClassName}
                rows={4}
              />
            </div>
          </div>

          <div>
            <label htmlFor={notesId} className={labelClassName}>
              Internal Notes for Olio Team
            </label>
            <textarea
              id={notesId}
              value={form.internalNotes}
              onChange={(event) =>
                updateField("internalNotes", event.target.value)
              }
              disabled={submitting}
              className={cn(textareaClassName, "min-h-[6.5rem]")}
              rows={5}
            />
          </div>

          {error ?
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          : null}

          {result?.message && !error ?
            <p
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                result.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
              )}
            >
              {result.message}
            </p>
          : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              className="h-11 flex-1 bg-blue-600 text-base font-medium text-white hover:bg-blue-500"
              disabled={submitting}
            >
              {submitting ? "Processing…" : "Create SOW"}
            </Button>
            {results.length > 0 ?
              <Button
                type="button"
                variant="outline"
                className="crm-toolbar-btn h-11 flex-1"
                onClick={() => setShowResults(true)}
                disabled={submitting}
              >
                Show Results
              </Button>
            : null}
          </div>
        </form>
      </div>

      {showResults ?
        <ResultsModal
          results={results}
          onClose={() => setShowResults(false)}
        />
      : null}
    </div>
  );
}

function ResultsModal({
  results,
  onClose,
}: {
  results: MassRenewalResultItem[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Final Results"
        className="w-full max-w-lg rounded-2xl border border-crm-border bg-crm-panel p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between border-b border-crm-border pb-3">
          <h3 className="text-lg font-semibold text-crm-text">Final Results</h3>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="crm-toolbar-btn"
            aria-label="Close results"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {results.map((item, index) => (
            <li
              key={`${item.status}-${index}`}
              className={cn(
                "rounded-lg border-l-4 p-2 text-sm shadow-sm",
                item.status === "success"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                  : "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300",
              )}
            >
              {item.msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
