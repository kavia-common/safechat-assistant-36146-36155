import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatSummary } from '../../models/chat.models';

/**
 * Sidebar shows conversation history and a "New chat" action.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">⛵</div>
        <div class="name">SafeChat</div>
      </div>
      <button class="new" (click)="newChat.emit()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
        <span>New Chat</span>
      </button>

      <div class="section">History</div>
      <div class="list">
        <button
          *ngFor="let item of items"
          class="item"
          [class.active]="item.id===activeId"
          (click)="select.emit(item.id)">
          <div class="title" [title]="item.title">{{ item.title }}</div>
          <div class="time">{{ item.updatedAt | date:'short' }}</div>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0; top: 0; bottom: 0;
      width: 18rem;
      background: linear-gradient(180deg, #ffffff 0%, #F3F4F6 100%);
      border-right: 1px solid #E5E7EB;
      padding: 1rem .75rem;
      display: flex; flex-direction: column;
      gap: .75rem;
    }
    @media (max-width: 1024px) {
      .sidebar { width: 100%; height: auto; position: static; border-right: 0; border-bottom: 1px solid #E5E7EB; }
    }
    .brand {
      display: flex; align-items: center; gap: .5rem;
      padding: .25rem .5rem;
    }
    .logo {
      width: 2rem; height: 2rem; display: grid; place-items: center;
      border-radius: .5rem;
      background: radial-gradient(circle at 30% 30%, #93C5FD, #2563EB);
      color: white; font-size: 1rem;
      box-shadow: 0 8px 22px rgba(37,99,235,.35);
    }
    .name { font-weight: 800; color: #0B3B5E; font-size: 1.05rem; }
    .new {
      margin: .25rem .25rem .25rem .5rem;
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .5rem .75rem;
      border-radius: .5rem;
      border: 1px solid #BFDBFE;
      color: #1E3A8A; background: #EFF6FF;
      font-weight: 700; cursor: pointer;
      transition: background .15s ease, transform .05s ease;
    }
    .new:hover { background: #DBEAFE; transform: translateY(-1px); }
    .section {
      font-size: .75rem; font-weight: 800; letter-spacing: .06em;
      color: #6B7280; text-transform: uppercase;
      padding: .25rem .75rem;
    }
    .list { overflow: auto; }
    .item {
      display: block; width: 100%; text-align: left;
      background: #ffffff;
      border: 1px solid #E5E7EB; border-radius: .5rem;
      padding: .5rem .75rem; margin: .25rem .25rem;
      cursor: pointer;
      transition: border-color .15s ease, box-shadow .15s ease, transform .05s ease;
    }
    .item:hover {
      border-color: #93C5FD;
      box-shadow: 0 8px 22px rgba(0,0,0,.06);
      transform: translateY(-1px);
    }
    .item.active {
      border-color: #2563EB;
      box-shadow: 0 8px 24px rgba(37,99,235,.25);
    }
    .title {
      font-weight: 700; font-size: .95rem; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .time { font-size: .75rem; color: #6B7280; }
  `]
})
export class SidebarComponent {
  @Input() items: ChatSummary[] = [];
  @Input() activeId: string | null = null;

  @Output() select = new EventEmitter<string>();
  @Output() newChat = new EventEmitter<void>();
}
