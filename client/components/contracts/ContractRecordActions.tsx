"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SEND_MESSAGE_BUTTON_LABEL,
  SendMessageWidget,
} from "@/widgets/send-message";

/** Record-view custom buttons (Zoho-style labels). */
export const CONTRACT_RECORD_BUTTONS = [
  "Create Service Completion",
  "TestRecordWidget",
  SEND_MESSAGE_BUTTON_LABEL,
  "Create Contract PDF",
  "Sync With Books",
  "Renew Contract",
  "Status Pending Sales Review",
  "Status Client Sending RFP",
  "Status Sourcing Vendor",
  "Complince Fields",
  "PO Addendum",
  "Status Client Negotiations",
  "Status Vendor Compliance",
  "Clone Contract",
] as const;

export type ContractRecordButtonLabel = (typeof CONTRACT_RECORD_BUTTONS)[number];

type ContractRecordActionsProps = {
  className?: string;
  recordId: string;
  onAction?: (action: ContractRecordButtonLabel, recordId: string) => void;
};

export function ContractRecordActions({
  className,
  recordId,
  onAction,
}: ContractRecordActionsProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONTRACT_RECORD_BUTTONS;
    return CONTRACT_RECORD_BUTTONS.filter((label) =>
      label.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function handleAction(action: ContractRecordButtonLabel) {
    setOpen(false);

    if (action === SEND_MESSAGE_BUTTON_LABEL) {
      setSendMessageOpen(true);
      onAction?.(action, recordId);
      return;
    }

    onAction?.(action, recordId);
  }

  return (
    <>
      <div ref={rootRef} className={cn("relative", className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="crm-toolbar-btn h-8 gap-1.5 px-3 text-sm"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Buttons
          <ChevronDown
            className={cn(
              "size-3.5 text-crm-text-muted transition",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>

        {open ?
          <div
            className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-crm-border bg-crm-panel shadow-xl"
            role="menu"
            aria-label="Record buttons"
          >
            <div className="border-b border-crm-border p-2.5">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-crm-text-muted"
                  aria-hidden
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Button"
                  className="h-9 w-full rounded-lg border border-crm-border bg-crm-panel py-2 pl-8 pr-3 text-sm text-crm-text outline-none placeholder:text-crm-text-muted focus:border-blue-500"
                  aria-label="Search buttons"
                />
              </div>
            </div>

            <div className="max-h-[min(22rem,50vh)] overflow-y-auto overscroll-contain py-1">
              {filtered.length === 0 ?
                <p className="px-3 py-6 text-center text-sm text-crm-text-muted">
                  No buttons match your search.
                </p>
              : filtered.map((label) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    className="flex w-full cursor-pointer px-3 py-2.5 text-left text-sm text-crm-text transition hover:bg-blue-500/10"
                    onClick={() => handleAction(label)}
                  >
                    {label}
                  </button>
                ))
              }
            </div>
          </div>
        : null}
      </div>

      <SendMessageWidget
        open={sendMessageOpen}
        onClose={() => setSendMessageOpen(false)}
        selectedRecordIds={[recordId]}
        module="Contracts"
      />
    </>
  );
}
