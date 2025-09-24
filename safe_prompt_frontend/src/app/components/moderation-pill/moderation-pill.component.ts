import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModerationInfo } from '../../models/chat.models';

/**
 * Displays a small pill showing moderation status and reason.
 */
@Component({
  selector: 'app-moderation-pill',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="info?.moderated" class="pill" [title]="info?.details || info?.reason || 'Moderated'">
      <span class="dot"></span>
      <span class="text">{{ info?.reason || 'Moderated' }}</span>
    </div>
  `,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      gap: .375rem;
      padding: .25rem .5rem;
      border-radius: 9999px;
      background: #FEF3C7; /* amber-100 */
      color: #92400E; /* amber-800 */
      border: 1px solid #FDE68A; /* amber-300 */
      font-size: .75rem;
      font-weight: 600;
    }
    .dot {
      width: .4rem;
      height: .4rem;
      border-radius: 9999px;
      background: #F59E0B; /* amber-500 */
      box-shadow: 0 0 0 2px rgba(245,158,11,.15);
    }
    .text { line-height: 1; }
  `]
})
export class ModerationPillComponent {
  @Input() info?: ModerationInfo;
}
