/** Zoho rich-text / long multi-line fields shown as formatted content on record detail. */
const RICH_TEXT_API_NAMES = new Set([
  "Client_Addendum_Rich",
  "Vendor_Addendum_Rich",
  "Contract_Summary",
  "Client_Summary",
  "Internal_Notes_for_Olio_Team",
  "Scheduled_Service_Notes",
  "PO_Notes",
  "Progress_Notes_1",
]);

export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function isRichTextField(apiName: string, dataType?: string): boolean {
  const type = (dataType ?? "").toLowerCase();
  if (type === "richtext" || type === "textarea") return true;
  return RICH_TEXT_API_NAMES.has(apiName);
}

/** Strip risky tags/handlers from Zoho rich HTML; keep formatting tags. */
export function sanitizeCrmRichHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*("[\s\S]*?"|'[\s\S]*?'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    /* Drop Zoho empty spacer paragraphs so the layout breathes less awkwardly */
    .replace(/<p[^>]*>\s*(?:<span[^>]*>\s*)?(?:<br\s*\/?>\s*)+(?:\s*<\/span>)?\s*<\/p>/gi, "")
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, "<br>")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sstyle='[^']*'/gi, "");
}

export function shouldRenderAsRichHtml(apiName: string, value: string, dataType?: string): boolean {
  if (!value?.trim()) return false;
  if (looksLikeHtml(value)) return true;
  const type = (dataType ?? "").toLowerCase();
  return type === "richtext";
}

export function shouldUseWideFieldLayout(apiName: string, value: string, dataType?: string): boolean {
  if (!value?.trim()) return false;
  if (isRichTextField(apiName, dataType)) return true;
  if (looksLikeHtml(value)) return true;
  return value.includes("\n") && value.length > 80;
}

/** Plain-text snippet for titles/tooltips when a cell holds Zoho HTML. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
