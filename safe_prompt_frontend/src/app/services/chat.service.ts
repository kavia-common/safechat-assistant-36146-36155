import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessage, Conversation, SendMessageRequest, SendMessageResponse, ChatSummary } from '../models/chat.models';

/**
 * ChatService handles communication with the backend API and provides
 * reactive streams for current conversation and chat history.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  private conversations$ = new BehaviorSubject<Conversation[]>([]);
  private activeConversation$ = new BehaviorSubject<Conversation | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private lastError$ = new BehaviorSubject<string | null>(null);

  // PUBLIC_INTERFACE
  /**
   * Observable of the list of conversations in history.
   */
  get history$(): Observable<ChatSummary[]> {
    return this.conversations$.pipe(
      map((convs) =>
        convs
          .slice()
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))
      )
    );
  }

  // PUBLIC_INTERFACE
  /**
   * Observable of the active conversation.
   */
  get active$(): Observable<Conversation | null> {
    return this.activeConversation$.asObservable();
  }

  // PUBLIC_INTERFACE
  /**
   * Observable of loading state for API calls.
   */
  get loadingState$(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  // PUBLIC_INTERFACE
  /**
   * Observable of last error message (or null).
   */
  get error$(): Observable<string | null> {
    return this.lastError$.asObservable();
  }

  /**
   * Initialize with empty default conversation state.
   */
  constructor() {
    // Optionally prefetch history on service creation.
    this.fetchHistory().subscribe();
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new conversation and set as active.
   */
  newConversation(initialTitle = 'New Chat'): void {
    const newConv: Conversation = {
      id: this.generateId(),
      title: initialTitle,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    const current = this.conversations$.value;
    this.conversations$.next([newConv, ...current]);
    this.activeConversation$.next(newConv);
  }

  // PUBLIC_INTERFACE
  /**
   * Select an existing conversation as active by id.
   */
  selectConversation(id: string): void {
    const conv = this.conversations$.value.find((c) => c.id === id) || null;
    this.activeConversation$.next(conv);
  }

  // PUBLIC_INTERFACE
  /**
   * Send a user message to the backend for the active conversation.
   * If no active conversation exists, a new one will be created.
   */
  sendMessage(content: string): Observable<Conversation> {
    let conv = this.activeConversation$.value;
    if (!conv) {
      this.newConversation(this.makeTitleFromContent(content));
      conv = this.activeConversation$.value!;
    } else if (conv.messages.length === 0) {
      // Set title from first message
      conv.title = this.makeTitleFromContent(content);
    }

    const req: SendMessageRequest = {
      conversationId: conv.id,
      content
    };

    const url = `${environment.apiBaseUrl}/chat/send`;
    this.loading$.next(true);
    this.lastError$.next(null);

    // Optimistic update: push user message
    const userMessage = this.createMessage('user', content);
    conv.messages = [...conv.messages, userMessage];
    conv.updatedAt = new Date().toISOString();
    this.updateConversation(conv);

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<SendMessageResponse>(url, req, { headers }).pipe(
      tap((res) => {
        // Defensive: some backends may wrap data or return plain text
        const normalized = this.normalizeSendResponse(res as any);

        // Merge response: ensure conversation exists
        const active = this.conversations$.value.find((c) => c.id === normalized.conversationId);
        let working = active ?? conv;

        // If backend returns full messages, replace; otherwise keep optimistic user message
        if (normalized.messages && normalized.messages.length > 0) {
          working = {
            ...working,
            messages: normalized.messages,
            updatedAt: new Date().toISOString(),
          };
        }

        // If moderation info present and applies to last user message, attach to it.
        if (normalized.moderation && working.messages.length > 0) {
          const lastUserIndex = [...working.messages]
            .reverse()
            .findIndex((m) => m.role === 'user');
          if (lastUserIndex !== -1) {
            const idx = working.messages.length - 1 - lastUserIndex;
            const updated = working.messages.map((m, i) =>
              i === idx ? { ...m, moderation: normalized.moderation } : m
            );
            working = { ...working, messages: updated };
          }
        }

        this.updateConversation(working);
        this.activeConversation$.next(working);
      }),
      map(() => this.activeConversation$.value!),
      catchError((err: HttpErrorResponse) => {
        // Ensure loading is reset on error
        this.loading$.next(false);
        this.lastError$.next(this.humanizeHttpError(err));
        // Rollback optimistic user message by removing last if assistant failed
        const rollback = this.activeConversation$.value;
        if (rollback) {
          rollback.messages = rollback.messages.filter((m) => m.id !== userMessage.id);
          this.updateConversation(rollback);
          this.activeConversation$.next(rollback);
        }
        return throwError(() => err);
      }),
      tap(() => this.loading$.next(false))
    );
  }

  // PUBLIC_INTERFACE
  /**
   * Fetch chat history summaries from backend (if available).
   * If the backend is not ready, this will safely no-op.
   */
  fetchHistory(): Observable<ChatSummary[]> {
    const url = `${environment.apiBaseUrl}/chat/history`;
    return this.http.get<ChatSummary[]>(url).pipe(
      tap((summaries) => {
        // Merge summaries with local cache; do not drop local inactive conversations
        const existing = this.conversations$.value.reduce<Record<string, Conversation>>((acc, c) => {
          acc[c.id] = c;
          return acc;
        }, {});
        const merged: Conversation[] = summaries.map((s) => {
          const prev = existing[s.id];
          return prev
            ? { ...prev, title: s.title, updatedAt: s.updatedAt }
            : { id: s.id, title: s.title, updatedAt: s.updatedAt, messages: [] };
        });
        // Keep local-only ones too
        const localOnly = this.conversations$.value.filter(
          (c) => !summaries.some((s) => s.id === c.id)
        );
        this.conversations$.next([...merged, ...localOnly]);
      }),
      catchError((_e) => {
        // Backend may not provide history endpoint; ignore errors for now.
        return of([]);
      })
    );
  }

  // PUBLIC_INTERFACE
  /**
   * Load a conversation detail by id.
   */
  loadConversation(id: string): Observable<Conversation | null> {
    const url = `${environment.apiBaseUrl}/chat/conversation/${encodeURIComponent(id)}`;
    this.loading$.next(true);
    this.lastError$.next(null);

    return this.http.get<Conversation>(url).pipe(
      tap((conv) => {
        this.updateConversation(conv);
        this.activeConversation$.next(conv);
      }),
      catchError((err) => {
        this.lastError$.next(this.humanizeHttpError(err));
        return of(null);
      }),
      tap(() => this.loading$.next(false))
    );
  }

  // Helpers

  private updateConversation(updated: Conversation): void {
    const list = this.conversations$.value.slice();
    const idx = list.findIndex((c) => c.id === updated.id);
    if (idx >= 0) list[idx] = updated;
    else list.unshift(updated);
    this.conversations$.next(list);
  }

  private createMessage(role: 'user' | 'assistant' | 'system', content: string): ChatMessage {
    return {
      id: this.generateId(),
      role,
      content,
      createdAt: new Date().toISOString(),
    };
  }

  private makeTitleFromContent(content: string): string {
    const trimmed = content.trim().replace(/\s+/g, ' ');
    return trimmed.length > 28 ? trimmed.slice(0, 27) + '…' : trimmed || 'New Chat';
    }

  private generateId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private humanizeHttpError(err: any): string {
    try {
      // Handle Angular HttpErrorResponse
      if (err && typeof err === 'object' && 'status' in err) {
        const he = err as HttpErrorResponse;

        // If backend returned a string error body, prefer it
        if (typeof he.error === 'string' && he.error.trim()) {
          return he.error;
        }

        // If backend returned JSON with message field
        if (he.error && typeof he.error === 'object' && typeof he.error.message === 'string') {
          return he.error.message;
        }

        // If status is 0, it is often a network or CORS error
        if (he.status === 0) {
          return 'Network error or CORS blocked the request.';
        }

        // Some setups wrongly throw even on 200 with unexpected parse; make clearer
        if (he.status === 200) {
          return 'Received unexpected response format (200).';
        }

        // Fallback to status text or code
        if (he.status) {
          return he.statusText ? `${he.statusText} (${he.status})` : `Request failed (${he.status})`;
        }
      }

      // Non-HttpErrorResponse: try to stringify meaningful message
      if (err && typeof err.message === 'string') {
        return err.message;
      }
      if (typeof err === 'string') {
        return err;
      }
    } catch {
      // ignore
    }
    return 'An unexpected error occurred.';
  }

  /**
   * Normalize different backend response shapes for sendMessage endpoint.
   * Accepts:
   * - Proper SendMessageResponse
   * - Wrapped { data: SendMessageResponse }
   * - Plain text assistant message (fallback)
   */
  private normalizeSendResponse(res: any): SendMessageResponse {
    // Proper shape
    if (res && typeof res === 'object' && 'conversationId' in res) {
      return res as SendMessageResponse;
    }
    // Wrapped in data
    if (res && typeof res === 'object' && 'data' in res && res.data && typeof res.data === 'object') {
      const data = res.data;
      if ('conversationId' in data) {
        return data as SendMessageResponse;
      }
    }
    // If string, treat as assistant reply only
    if (typeof res === 'string') {
      const conversationId = this.activeConversation$.value?.id ?? this.generateId();
      return {
        conversationId,
        messages: [
          ...(this.activeConversation$.value?.messages ?? []),
          {
            id: this.generateId(),
            role: 'assistant',
            content: res,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
    // Unknown shape: return passthrough with current conversation id, no messages
    return {
      conversationId: this.activeConversation$.value?.id ?? this.generateId(),
      messages: this.activeConversation$.value?.messages ?? [],
    };
  }
}
