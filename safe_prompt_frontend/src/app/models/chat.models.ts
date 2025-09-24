/**
 * Shared models for chat domain.
 */

// PUBLIC_INTERFACE
export interface ModerationInfo {
  /** Whether the user input was moderated. */
  moderated: boolean;
  /** Optional reason for moderation (e.g., safety category). */
  reason?: string;
  /** Optional detailed notes or policy references. */
  details?: string;
}

// PUBLIC_INTERFACE
export interface ChatMessage {
  /** Unique id for the message. */
  id: string;
  /** Role of the message author. */
  role: 'user' | 'assistant' | 'system';
  /** Message content. */
  content: string;
  /** Timestamp in ISO 8601 format. */
  createdAt: string;
  /** Moderation information for messages that were flagged/rejected. */
  moderation?: ModerationInfo;
}

// PUBLIC_INTERFACE
export interface ChatSummary {
  /** Conversation id. */
  id: string;
  /** Human-friendly name to display in sidebar. */
  title: string;
  /** ISO timestamp of last activity. */
  updatedAt: string;
}

// PUBLIC_INTERFACE
export interface SendMessageRequest {
  /** Conversation id (create new if null or empty). */
  conversationId?: string | null;
  /** User message content. */
  content: string;
}

// PUBLIC_INTERFACE
export interface SendMessageResponse {
  /** Conversation id used. */
  conversationId: string;
  /** Complete message list after the send operation, if backend supports; else at least the assistant message. */
  messages: ChatMessage[];
  /** Optional moderation info for the user input. */
  moderation?: ModerationInfo;
}

// PUBLIC_INTERFACE
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}
