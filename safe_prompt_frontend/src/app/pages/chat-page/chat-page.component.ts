import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ConversationViewComponent } from '../../components/conversation-view/conversation-view.component';
import { ChatInputComponent } from '../../components/chat-input/chat-input.component';
import { ChatService } from '../../services/chat.service';
import { Conversation } from '../../models/chat.models';

/**
 * Main chat page composing the layout:
 * - Sidebar with history
 * - Conversation view
 * - Floating input at bottom
 */
@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ConversationViewComponent, ChatInputComponent],
  template: `
    <div class="layout">
      <app-sidebar
        class="side"
        [items]="history()"
        [activeId]="active()?.id || null"
        (select)="onSelect($event)"
        (newChat)="onNewChat()"></app-sidebar>

      <main class="main">
        <header class="topbar">
          <div class="heading">
            <div class="title">{{ active()?.title || 'Welcome' }}</div>
            <div class="subtitle">Ocean Professional • Clean • Minimal</div>
          </div>
          <div class="status">
            <span class="status-dot" [class.busy]="loading()"></span>
            <span class="status-text">{{ loading() ? 'Thinking...' : 'Ready' }}</span>
          </div>
        </header>

        <section class="content">
          <div *ngIf="error()" class="error-banner">
            <strong>Request error:</strong> {{ error() }}
          </div>
          <app-conversation-view [conversation]="active()"></app-conversation-view>
        </section>
      </main>

      <app-chat-input
        [disabled]="loading()"
        (send)="onSend($event)"></app-chat-input>
    </div>
  `,
  styles: [`
    .layout {
      display: grid;
      grid-template-columns: 18rem 1fr;
      min-height: 100vh;
      background: #f9fafb;
    }
    @media (max-width: 1024px) {
      .layout { grid-template-columns: 1fr; }
    }
    .side { grid-column: 1; }
    .main {
      grid-column: 2;
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
      position: relative;
    }
    @media (max-width: 1024px) {
      .main { grid-column: 1; }
    }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, rgba(37,99,235,.08), rgba(255,255,255,1) 42%);
      border-bottom: 1px solid #E5E7EB;
    }
    .heading .title {
      font-weight: 800; color: #0B3B5E;
      font-size: 1.15rem;
    }
    .heading .subtitle {
      font-size: .8rem; color: #6B7280;
    }
    .status {
      display: inline-flex; align-items: center; gap: .5rem;
      color: #111827; font-weight: 700;
    }
    .status-dot {
      width: .6rem; height: .6rem; border-radius: 9999px; background: #10B981; /* emerald-500 */
      box-shadow: 0 0 0 4px rgba(16,185,129,.15);
      transition: background .15s ease, box-shadow .15s ease;
    }
    .status-dot.busy {
      background: #F59E0B; /* amber-500 */
      box-shadow: 0 0 0 4px rgba(245,158,11,.15);
    }
    .content { position: relative; height: calc(100vh - 64px); }
    .error-banner {
      position: sticky; top: 0; z-index: 5;
      margin: .75rem 1rem;
      padding: .5rem .75rem;
      border-radius: .5rem;
      border: 1px solid #FCA5A5;
      background: #FEF2F2;
      color: #991B1B;
      box-shadow: 0 8px 22px rgba(239,68,68,.15);
    }
  `]
})
export class ChatPageComponent implements OnInit {
  private chat = inject(ChatService);

  history = signal(this.chat['conversations$'].value.map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt })));
  active = signal<Conversation | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.chat.history$.subscribe(h => this.history.set(h));
    this.chat.active$.subscribe(c => this.active.set(c));
    this.chat.loadingState$.subscribe(v => this.loading.set(v));
    this.chat.error$.subscribe(e => this.error.set(e));

    // Ensure there is at least one conversation to start typing into.
    if (!this.chat['conversations$'].value.length) {
      this.chat.newConversation();
    }
  }

  onSelect(id: string) {
    this.chat.selectConversation(id);
  }

  onNewChat() {
    this.chat.newConversation();
  }

  onSend(content: string) {
    this.chat.sendMessage(content).subscribe();
  }
}
