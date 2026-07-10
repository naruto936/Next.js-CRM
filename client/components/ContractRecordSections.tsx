"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CrmRecordSection, RecordFieldRow } from "@/lib/contractRecordLayout";
import { isScopeOfWorkSubformSection } from "@/lib/contractScopeOfWork";
import type { ContractScopeOfWorkRow } from "@/lib/contractScopeOfWork";
import { ContractScopeOfWorkTable } from "@/components/ContractScopeOfWorkTable";

type FieldValueRendererProps = {
  apiName: string;
  value: string;
  dataType: string;
  label?: string;
};

type ContractRecordSectionsProps = {
  groups: { section: CrmRecordSection; rows: RecordFieldRow[] }[];
  scopeOfWorkByField?: Record<string, ContractScopeOfWorkRow[]>;
  renderFieldValue: (props: FieldValueRendererProps) => ReactNode;
};

function RecordFieldGrid({
  rows,
  renderFieldValue,
}: {
  rows: RecordFieldRow[];
  renderFieldValue: (props: FieldValueRendererProps) => ReactNode;
}) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.apiName} className="min-w-0 border-b border-crm-border pb-4">
          <dt className="record-field-label">{row.label}</dt>
          <dd className="mt-1.5 min-w-0 text-sm">
            {renderFieldValue({
              apiName: row.apiName,
              value: row.value,
              dataType: row.dataType,
              label: row.label,
            })}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RecordSectionBlock({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <section className="crm-record-section overflow-hidden rounded-lg border border-crm-border bg-crm-panel shadow-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "crm-record-section-header flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition sm:py-4",
          open && "border-b border-crm-border",
        )}
        aria-expanded={open}
      >
        <h2 className="text-sm font-semibold tracking-tight sm:text-base">{title}</h2>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 opacity-80 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ?
        <div className="bg-crm-panel px-4 pb-5 pt-4">{children}</div>
      : null}
    </section>
  );
}

export function ContractRecordSections({
  groups,
  scopeOfWorkByField = {},
  renderFieldValue,
}: ContractRecordSectionsProps) {
  if (groups.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-crm-text-muted">No fields to display.</p>
    );
  }

  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      {groups.map(({ section, rows }) => {
        const subformKey = section.fieldApiNames[0];
        const scopeRows =
          section.kind === "subform" && subformKey ?
            scopeOfWorkByField[subformKey]
          : undefined;
        const showScopeTable =
          scopeRows != null &&
          (isScopeOfWorkSubformSection(section.fieldApiNames) ||
            /scope of work/i.test(section.title));

        return (
        <RecordSectionBlock key={section.id} title={section.title}>
          {showScopeTable ?
            <ContractScopeOfWorkTable rows={scopeRows} />
          : section.kind === "subform" && rows.length === 0 ?
            <p className="text-sm text-crm-text-muted">
              Subform data is not shown in this view yet.
            </p>
          : <RecordFieldGrid rows={rows} renderFieldValue={renderFieldValue} />}
        </RecordSectionBlock>
        );
      })}
    </div>
  );
}
