"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CreateServiceCompletionDraftResult,
  CreateServiceCompletionResult,
  ServiceCompletionDraft,
} from "@/widgets/create-service-completion/types";

const inputClassName = cn(
  "h-10 w-full rounded-lg border border-crm-border bg-crm-panel px-3 text-sm text-crm-text",
  "outline-none transition-colors placeholder:text-crm-muted",
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

const labelClassName = "text-sm font-medium text-crm-text";

type CreateServiceCompletionFormProps = {
  contractId: string;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClassName}>{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyValue({ value }: { value: string }) {
  return (
    <div
      className={cn(
        inputClassName,
        "flex items-center bg-crm-canvas/60 text-crm-muted",
      )}
    >
      {value || "—"}
    </div>
  );
}

/**
 * Prefills Service Completion fields from a Contract (Deluge map),
 * then creates the Zoho record when the user clicks Save.
 */
export function CreateServiceCompletionForm({
  contractId,
}: CreateServiceCompletionFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceCompletionDraft | null>(null);

  const [name, setName] = useState("");
  const [status, setStatus] = useState("Pending");
  const [locationName, setLocationName] = useState("");
  const [locationStreet, setLocationStreet] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [units, setUnits] = useState("");

  useEffect(() => {
    if (!contractId) {
      setLoading(false);
      setError("Missing contract id.");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSuccess(null);

    fetch(
      `/api/widgets/create-service-completion?contractId=${encodeURIComponent(contractId)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const data = (await response.json().catch(
          () => ({}),
        )) as CreateServiceCompletionDraftResult;
        if (!response.ok || !data.ok || !data.draft) {
          throw new Error(data.message || "Failed to load draft.");
        }
        const d = data.draft;
        setDraft(d);
        setName(d.Name);
        setStatus(d.Status || "Pending");
        setLocationName(d.Location_Name);
        setLocationStreet(d.Location_Street);
        setLocationCity(d.Location_City);
        setLocationState(d.Location_State);
        setLocationCode(d.Location_Code);
        setUnits(d.Number_of_Units_at_location);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load draft.");
        setDraft(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [contractId]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/widgets/create-service-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          module: "Contracts",
          fields: {
            Name: name,
            Status: status,
            Location_Name: locationName,
            Location_Street: locationStreet,
            Location_City: locationCity,
            Location_State: locationState,
            Location_Code: locationCode,
            Number_of_Units_at_location: units,
          },
        }),
      });
      const data = (await response.json().catch(
        () => ({}),
      )) as CreateServiceCompletionResult;

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to create Service Completion.");
      }

      setSuccess(data.message || "Service Completion created.");
      if (data.openUrl) {
        window.location.assign(data.openUrl);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create Service Completion.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-crm-border bg-crm-panel shadow-sm">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-crm-border px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h1 className="page-heading truncate text-lg font-semibold text-crm-text">
            Create Service Completion
          </h1>
          <p className="mt-0.5 truncate text-sm text-crm-muted">
            Prefill from contract · review · Save to create
          </p>
        </div>
        <Button
          type="submit"
          form="create-sc-form"
          disabled={loading || saving || !draft}
          className="h-10 bg-blue-600 px-4 text-white hover:bg-blue-500"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {(loading || saving) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-crm-panel/70 backdrop-blur-[1px]">
            <Loader2 className="size-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {success}
          </div>
        )}

        {!loading && draft && (
          <form
            id="create-sc-form"
            onSubmit={handleSave}
            className="mx-auto flex max-w-3xl flex-col gap-6"
          >
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-crm-muted">
                Service overview
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    className={inputClassName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={saving}
                  />
                </Field>
                <Field label="Status">
                  <input
                    className={inputClassName}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={saving}
                  />
                </Field>
                <Field label="Layout">
                  <ReadOnlyValue value={draft.Layout.name} />
                </Field>
                <Field label="Number of units at location">
                  <input
                    className={inputClassName}
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    disabled={saving}
                  />
                </Field>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-crm-muted">
                Site & relationships
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Site">
                  <ReadOnlyValue value={draft.Site_Number.name} />
                </Field>
                <Field label="Contract">
                  <ReadOnlyValue value={draft.Contract.name} />
                </Field>
                <Field label="Vendor">
                  <ReadOnlyValue value={draft.Vendor?.name ?? ""} />
                </Field>
                <Field label="Client company">
                  <ReadOnlyValue
                    value={draft.Client_Company_Name?.name ?? ""}
                  />
                </Field>
                <Field label="Operations associate">
                  <ReadOnlyValue
                    value={draft.Operation_Associate?.name ?? ""}
                  />
                </Field>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-crm-muted">
                Location
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Location name">
                  <input
                    className={inputClassName}
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    disabled={saving}
                  />
                </Field>
                <Field label="Location code (zip)">
                  <input
                    className={inputClassName}
                    value={locationCode}
                    onChange={(e) => setLocationCode(e.target.value)}
                    disabled={saving}
                  />
                </Field>
                <Field label="Street">
                  <input
                    className={inputClassName}
                    value={locationStreet}
                    onChange={(e) => setLocationStreet(e.target.value)}
                    disabled={saving}
                  />
                </Field>
                <Field label="City">
                  <input
                    className={inputClassName}
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    disabled={saving}
                  />
                </Field>
                <Field label="State">
                  <input
                    className={inputClassName}
                    value={locationState}
                    onChange={(e) => setLocationState(e.target.value)}
                    disabled={saving}
                  />
                </Field>
              </div>
            </section>

            <div className="flex justify-end border-t border-crm-border pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="h-10 min-w-32 bg-blue-600 px-6 text-white hover:bg-blue-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
