import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Chat input with send button and multiline textarea.
 */
@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-wrap">
      <textarea
        [(ngModel)]="text"
        class="input"
        [placeholder]="placeholder"
        [disabled]="disabled"
        (keydown.enter)="onKeydownEnter($event)"
        rows="1"></textarea>

      <button class="send" (click)="submit()" [disabled]="disabled || !text.trim()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
        </svg>
        <span>Send</span>
      </button>
    </div>
  `,
  styles: [`
    .input-wrap {
      position: fixed;
      left: 20rem;
      right: 1rem;
      bottom: 1rem;
      display: flex;
      gap: .5rem;
      align-items: center;
      background: #ffffff;
      padding: .75rem;
      border-radius: .75rem;
      border: 1px solid #E5E7EB;
      box-shadow: 0 10px 30px rgba(17,24,39,.08);
    }
    @media (max-width: 1024px) {
      .input-wrap { left: 1rem; }
    }
    .input {
      flex: 1;
      resize: none;
      border: 1px solid #BFDBFE; /* blue-200 */
      padding: .625rem .75rem;
      border-radius: .5rem;
      outline: none;
      background: #F8FAFC; /* slate-50 */
      color: #111827;
      font-size: .95rem;
      transition: border-color .15s ease, box-shadow .15s ease;
    }
    .input:focus {
      border-color: #2563EB;
      box-shadow: 0 0 0 3px rgba(37,99,235,.15);
    }
    .send {
      display: inline-flex;
      align-items: center;
      gap: .375rem;
      padding: .55rem .9rem;
      border: none;
      border-radius: .5rem;
      background: linear-gradient(135deg, #2563EB, #1E40AF);
      color: #ffffff;
      font-weight: 700;
      cursor: pointer;
      transition: transform .05s ease, box-shadow .15s ease, opacity .2s;
      box-shadow: 0 8px 24px rgba(37,99,235,.35);
    }
    .send:hover { transform: translateY(-1px); }
    .send:disabled {
      opacity: .6;
      cursor: not-allowed;
      box-shadow: none;
    }
  `]
})
export class ChatInputComponent {
  @Input() placeholder = 'Type your message...';
  @Input() disabled = false;
  @Output() send = new EventEmitter<string>();

  text = '';

  private emit() {
    const content = this.text.trim();
    if (!content) return;
    this.send.emit(content);
    this.text = '';
  }

  submit() {
    this.emit();
  }

  // Narrow event shape locally to avoid referencing global KeyboardEvent (eslint no-undef in Node context)
  private isKeyEvent(obj: any): obj is { key: string; shiftKey?: boolean; preventDefault?: () => void } {
    return obj && typeof obj === 'object' && typeof obj.key === 'string';
  }

  onKeydownEnter(e: any) {
    const evt = this.isKeyEvent(e) ? e : null;
    // Send on Enter without shift; allow Shift+Enter for newline
    if (evt && evt.key === 'Enter' && !evt.shiftKey) {
      if (typeof evt.preventDefault === 'function') {
        evt.preventDefault();
      }
      this.emit();
    }
  }
}
