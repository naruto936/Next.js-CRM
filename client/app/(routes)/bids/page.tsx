"use client";

import { useCallback, useMemo, useState } from "react";
import SideBar from "@/components/SideBar";
import BidsTable from "@/components/BidsTable";
import type {
  ContractFieldFilterSelection,
  ContractFilterApplyPayload,
} from "@/lib/contractFilterTypes";
import {
  BIDS_STATIC_ALL_VIEW_ID,
  BIDS_STATIC_FILTER_FIELDS,
  BIDS_STATIC_FILTER_SECTIONS,
} from "@/lib/bidsStaticData";

export default function BidsPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customViewId, setCustomViewId] = useState<string | null>(null);
  const [fieldSelections, setFieldSelections] = useState<ContractFieldFilterSelection[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const staticFilterMeta = useMemo(
    () => ({
      sections: BIDS_STATIC_FILTER_SECTIONS,
      fields: BIDS_STATIC_FILTER_FIELDS,
    }),
    [],
  );

  const handleFilteredTotalChange = useCallback((total: number | null) => {
    setFilteredTotal(total);
  }, []);

  const handleRecordsLoadingChange = useCallback((loading: boolean) => {
    setRecordsLoading(loading);
  }, []);

  const handleApplyFilters = useCallback((payload: ContractFilterApplyPayload) => {
    setCustomViewId(payload.customViewId);
    setFieldSelections(payload.fieldSelections ?? []);
    if (!payload.customViewId || payload.customViewId === BIDS_STATIC_ALL_VIEW_ID) {
      if (!(payload.fieldSelections?.length ?? 0)) {
        setFilteredTotal(null);
      }
    }
  }, []);

  const listFiltersActive = fieldSelections.length > 0;

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-crm-canvas p-2 sm:p-3">
      <div className="relative flex h-full min-h-0 gap-2 sm:gap-3 md:flex-row">
        <SideBar
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          searchCriteria={null}
          customViewId={customViewId}
          filteredTotal={filteredTotal}
          applyLoading={recordsLoading}
          onApplyFilters={handleApplyFilters}
          filterPanelId="bids-filters"
          filterAriaLabel="Bid filters"
          filterMetaOverride={staticFilterMeta}
          listFiltersActive={listFiltersActive}
        />
        <BidsTable
          filtersOpen={filtersOpen}
          onOpenFilters={() => setFiltersOpen(true)}
          customViewId={customViewId}
          fieldSelections={fieldSelections}
          onClearSearchCriteria={() => {
            setCustomViewId(null);
            setFieldSelections([]);
            setFilteredTotal(null);
          }}
          onFilteredTotalChange={handleFilteredTotalChange}
          onRecordsLoadingChange={handleRecordsLoadingChange}
        />
      </div>
    </div>
  );
}
