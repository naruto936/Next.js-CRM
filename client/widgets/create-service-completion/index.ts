import type { CrmWidgetDefinition } from "@/widgets/types";
import {
  CREATE_SERVICE_COMPLETION_BUTTON_LABEL,
  CREATE_SERVICE_COMPLETION_PAGE_PATH,
  CREATE_SERVICE_COMPLETION_WIDGET_NAME,
} from "@/widgets/create-service-completion/types";

export {
  CREATE_SERVICE_COMPLETION_BUTTON_LABEL,
  CREATE_SERVICE_COMPLETION_PAGE_PATH,
  CREATE_SERVICE_COMPLETION_WIDGET_NAME,
  SERVICE_COMPLETIONS_MODULE,
  SERVICE_COMPLETION_ZOHO_RECORD_URL,
} from "./types";

export type {
  CreateServiceCompletionDraftResult,
  CreateServiceCompletionPayload,
  CreateServiceCompletionResult,
  ServiceCompletionDraft,
  ServiceCompletionEditableFields,
} from "./types";

export const CREATE_SERVICE_COMPLETION_WIDGET = {
  id: "create-service-completion",
  name: CREATE_SERVICE_COMPLETION_WIDGET_NAME,
  buttonLabel: CREATE_SERVICE_COMPLETION_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export {
  createServiceCompletionFromContract,
  loadServiceCompletionDraft,
} from "./server/createServiceCompletion";

export { CreateServiceCompletionForm } from "./ui/CreateServiceCompletionForm";
