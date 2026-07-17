/**
 * Shared types for CRM list-action widgets.
 * Each widget lives under `widgets/<widget-slug>/` with its own UI + server logic.
 */

export type WidgetRecordRef = {
  id: string;
};

export type WidgetOpenContext = {
  /** Selected contract (or other module) record IDs from the list view. */
  selectedRecordIds: string[];
  /** Zoho / CRM module the list belongs to. */
  module?: string;
};

export type CrmWidgetDefinition = {
  /** Stable slug used for folders and API routes. */
  id: string;
  /** Human-readable widget name (matches Zoho widget naming). */
  name: string;
  /** Toolbar / menu button label that opens this widget. */
  buttonLabel: string;
};
