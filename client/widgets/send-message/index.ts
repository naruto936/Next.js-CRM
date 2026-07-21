import type { CrmWidgetDefinition } from "@/widgets/types";

/** Button label on the contract record view Buttons menu. */
export const SEND_MESSAGE_BUTTON_LABEL = "Send Message" as const;

/** Widget modal title (matches send-message.html heading). */
export const SEND_MESSAGE_WIDGET_NAME = "Send Custom Message" as const;

export const SEND_MESSAGE_WIDGET = {
  id: "send-message",
  name: SEND_MESSAGE_WIDGET_NAME,
  buttonLabel: SEND_MESSAGE_BUTTON_LABEL,
} as const satisfies CrmWidgetDefinition;

export type { SendMessagePayload, SendMessageResult } from "./types";

export { SEND_MESSAGE_FUNCTION_NAME } from "./types";

export { SendMessageWidget } from "./ui/SendMessageWidget";
