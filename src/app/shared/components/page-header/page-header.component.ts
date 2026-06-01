import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="header-left">
        @if (backLink) {

          <a class="back-btn" (click)="history.back()" [attr.aria-label]="'Voltar'">
            ←
          </a>
        }
        <div class="title-block">
          @if (eyebrow) {
            <span class="eyebrow">{{ eyebrow }}</span>
          }
          <h1>{{ title }}</h1>
          @if (subtitle) {
            <p class="subtitle">{{ subtitle }}</p>
          }
        </div>
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text2);
      font-size: 1.1rem;
      text-decoration: none;
      transition: all 0.2s;
      flex-shrink: 0;
      

      &:hover {
        cursor: pointer;
        border-color: var(--accent);
        color: var(--accent);
      }
    }

    .title-block {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .eyebrow {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
    }

    h1 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2rem;
      letter-spacing: 0.04em;
      line-height: 1;
      color: var(--text);
    }

    .subtitle {
      font-size: 0.88rem;
      color: var(--text2);
      margin-top: 0.2rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() backLink: string | null = null;
  protected readonly history = history;
}
