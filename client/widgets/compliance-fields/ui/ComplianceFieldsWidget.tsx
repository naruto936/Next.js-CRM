"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPLIANCE_FIELDS_WIDGET_NAME } from "@/widgets/compliance-fields";
import type {
  ComplianceFieldsForm,
  ComplianceFieldsLoadResult,
  ComplianceFieldsSaveResult,
} from "@/widgets/compliance-fields/types";
import type { WidgetOpenContext } from "@/widgets/types";

const EMPTY_FIELDS: ComplianceFieldsForm = {
  w9Url: "",
  coiExpiration: "",
  workersComp: "",
  legalName: "",
  bankAch: "",
};

type ComplianceFieldsWidgetProps = WidgetOpenContext & {
  open: boolean;
  onClose: () => void;
  className?: string;
};

/**
 * UI for “Complince Fields” — edit Vendor compliance fields linked to a Contract.
 * Mirrors complince.html / complince.js.
 */
export function ComplianceFieldsWidget({
  open,
  onClose,
  selectedRecordIds,
  className,
}: ComplianceFieldsWidgetProps) {
  const titleId = useId();
  const contractId = selectedRecordIds[0]?.trim() ?? "";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [fields, setFields] = useState<ComplianceFieldsForm>(EMPTY_FIELDS);

  const [openSnapshot, setOpenSnapshot] = useState(false);
  if (open !== openSnapshot) {
    setOpenSnapshot(open);
    if (open) {
      setLoading(false);
      setSaving(false);
      setError(null);
      setSuccess(null);
      setVendorId("");
      setVendorName("");
      setFields(EMPTY_FIELDS);
    }
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving && !loading) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, saving, loading]);

  useEffect(() => {
    if (!open || !contractId) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(
      `/api/widgets/compliance-fields?contractId=${encodeURIComponent(contractId)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const data = (await response.json().catch(
          () => ({}),
        )) as ComplianceFieldsLoadResult;
        if (!response.ok || !data.ok || !data.fields || !data.vendorId) {
          throw new Error(data.message || "Failed to load compliance fields.");
        }
        setVendorId(data.vendorId);
        setVendorName(data.vendorName || "");
        setFields(data.fields);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load compliance fields.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, contractId]);

  if (!open) return null;

  function updateField<K extends keyof ComplianceFieldsForm>(
    key: K,
    value: ComplianceFieldsForm[K],
  ) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);

    if (!vendorId) {
      setError("No vendor loaded. Close and reopen the widget.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/widgets/compliance-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, fields }),
      });
      const data = (await response.json().catch(
        () => ({}),
      )) as ComplianceFieldsSaveResult;
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to update vendor.");
      }
      setSuccess(data.message || "Vendor compliance updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update vendor.",
      );
    } finally {
      setSaving(false);
    }
  }

  const busy = loading || saving;
  const inputClassName =
    "h-10 w-full rounded-lg border border-crm-border bg-crm-panel px-3 text-sm text-crm-text outline-none placeholder:text-crm-text-muted focus:border-blue-500 disabled:opacity-60";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-[2px] dark:bg-black/60"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        className={cn(
          "relative w-full max-w-[32rem] overflow-hidden rounded-2xl border border-crm-border bg-crm-panel shadow-xl",
          className,
        )}
      >
        {busy ?
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-crm-panel/85 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="size-10 animate-spin text-blue-600"
              aria-hidden
            />
            <p className="text-sm font-medium text-crm-text">
              {saving ? "Saving…" : "Loading vendor…"}
            </p>
          </div>
        : null}

        <header className="flex items-start justify-between gap-3 border-b border-crm-border bg-crm-panel-muted/80 px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="page-heading truncate text-base sm:text-lg"
            >
              {COMPLIANCE_FIELDS_WIDGET_NAME}
            </h2>
            <p className="mt-1 text-sm text-crm-text-muted">
              {vendorName ?
                `Vendor: ${vendorName}`
              : "Edit vendor W9 / COI / ACH fields"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="crm-toolbar-btn shrink-0"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
          <div className="space-y-1.5">
            <label htmlFor="cf-w9" className="text-sm font-medium text-crm-text">
              Vendor-W9 URL
            </label>
            <input
              id="cf-w9"
              type="text"
              value={fields.w9Url}
              onChange={(e) => updateField("w9Url", e.target.value)}
              disabled={busy || !vendorId}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cf-coi"
              className="text-sm font-medium text-crm-text"
            >
              Vendor-COI Expiration
            </label>
            <input
              id="cf-coi"
              type="date"
              value={fields.coiExpiration}
              onChange={(e) => updateField("coiExpiration", e.target.value)}
              disabled={busy || !vendorId}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cf-wc"
              className="text-sm font-medium text-crm-text"
            >
              Vendor-Workers Compensation
            </label>
            <input
              id="cf-wc"
              type="text"
              value={fields.workersComp}
              onChange={(e) => updateField("workersComp", e.target.value)}
              disabled={busy || !vendorId}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cf-legal"
              className="text-sm font-medium text-crm-text"
            >
              Vendor-Legal Name (Must Be Same As W9)
            </label>
            <input
              id="cf-legal"
              type="text"
              value={fields.legalName}
              onChange={(e) => updateField("legalName", e.target.value)}
              disabled={busy || !vendorId}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cf-ach"
              className="text-sm font-medium text-crm-text"
            >
              Vendor-Bank ACH
            </label>
            <input
              id="cf-ach"
              type="text"
              value={fields.bankAch}
              onChange={(e) => updateField("bankAch", e.target.value)}
              disabled={busy || !vendorId}
              className={inputClassName}
            />
          </div>

          {error ?
            <p className="whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          : null}

          {success ?
            <p className="whitespace-pre-wrap rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
              {success}
            </p>
          : null}

          <Button
            type="button"
            className="h-10 w-full bg-blue-600 text-white hover:bg-blue-500"
            onClick={handleSave}
            disabled={busy || !vendorId}
          >
            Save / Update Vendor
          </Button>
        </div>
      </div>
    </div>
  );
}
