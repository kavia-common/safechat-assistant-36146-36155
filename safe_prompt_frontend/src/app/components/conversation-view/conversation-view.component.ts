import { Component, Input, OnChanges, SimpleChanges, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../models/chat.models';
import { ModerationPillComponent } from '../moderation-pill/moderation-pill.component';

/**
 * Renders the list of messages in a conversation with elegant styling.
 */
@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, ModerationPillComponent],
  template: `
    <div class="scroll" #scrollContainer>
      <ng-container *ngIf="conversation; else empty">
        <div class="message"
             *ngFor="let m of conversation.messages"
             [class.user]="m.role==='user'"
             [class.assistant]="m.role==='assistant'">
          <div class="bubble">
            <div class="meta">
              <span class="role" [class.user]="m.role==='user'" [class.assistant]="m.role==='assistant'">
                {{ m.role === 'assistant' ? 'Assistant' : 'You' }}
              </span>
              <span class="time">{{ m.createdAt | date:'short' }}</span>
              <app-moderation-pill *ngIf="m.moderation" [info]="m.moderation"></app-moderation-pill>
            </div>
            <div class="content">{{ m.content }}</div>
          </div>
        </div>
      </ng-container>
      <ng-template #empty>
        <div class="empty-state">
          <div class="title">Start a new conversation</div>
          <div class="subtitle">Your messages and AI responses will appear here.</div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .scroll {
      height: 100%;
      overflow: auto;
      padding: 1rem 1rem 7rem;
      background: linear-gradient(180deg, rgba(59,130,246,0.06) 0%, rgba(249,250,251,1) 24%);
    }
    .message {
      display: flex;
      margin: .5rem 0;
    }
    .message.user { justify-content: flex-end; }
    .message.assistant { justify-content: flex-start; }
    .bubble {
      max-width: min(780px, 85%);
      padding: .875rem 1rem;
      border-radius: .75rem;
      box-shadow: 0 4px 16px rgba(17,24,39,0.06);
      background: #ffffff;
      border: 1px solid #E5E7EB;
    }
    .message.user .bubble {
      background: #EFF6FF; /* blue-50 */
      border: 1px solid #BFDBFE; /* blue-200 */
    }
    .meta {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-bottom: .375rem;
    }
    .role {
      font-weight: 700;
      font-size: .75rem;
      color: #111827;
    }
    .role.user { color: #1E40AF; } /* blue-800 */
    .role.assistant { color: #0B3B5E; } /* deep ocean */
    .time {
      font-size: .75rem;
      color: #6B7280;
    }
    .content {
      white-space: pre-wrap;
      color: #111827;
      line-height: 1.5;
    }
    .empty-state {
      margin-top: 10vh;
      text-align: center;
      color: #6B7280;
    }
    .empty-state .title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0B3B5E;
      margin-bottom: .25rem;
    }
    .empty-state .subtitle {
      font-size: .95rem;
    }
  `]
})
export class ConversationViewComponent implements OnChanges {
  @Input() conversation: Conversation | null = null;

  ngOnChanges(_changes: SimpleChanges) {
    // Placeholder for future scroll-to-bottom logic if needed.
  }
}
