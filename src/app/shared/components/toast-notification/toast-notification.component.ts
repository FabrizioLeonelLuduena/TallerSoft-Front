import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import {
  NotificationService,
  AppNotification,
  NotificationType,
} from '../../../core/services/notification.service';

interface ActiveNotification extends AppNotification {
  visible: boolean;
  progress: number;
  intervalId?: ReturnType<typeof setInterval>;
  timeoutId?: ReturnType<typeof setTimeout>;
}

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div
          class="toast"
          [class]="'toast toast--' + toast.type"
          [class.toast--visible]="toast.visible"
          (mouseenter)="pauseToast(toast)"
          (mouseleave)="resumeToast(toast)"
        >
          <mat-icon class="toast__icon">{{ iconFor(toast.type) }}</mat-icon>
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" (click)="dismiss(toast)" aria-label="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
          <div class="toast__progress" [style.width.%]="toast.progress"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      width: 360px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-lg);
      background: var(--color-surface-container);
      border: 1px solid var(--color-surface-variant);
      border-left: 4px solid transparent;
      box-shadow: var(--shadow-elevated);
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
      line-height: var(--line-height-normal);
      pointer-events: all;
      position: relative;
      overflow: hidden;
      opacity: 0;
      transform: translateX(32px);
      transition: opacity 220ms ease, transform 220ms ease;
      cursor: default;
    }

    .toast--visible {
      opacity: 1;
      transform: translateX(0);
    }

    .toast--success { border-left-color: var(--color-success); }
    .toast--error   { border-left-color: var(--color-danger); }
    .toast--warning { border-left-color: var(--color-warning); }
    .toast--info    { border-left-color: var(--color-info); }

    .toast__icon {
      flex-shrink: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .toast--success .toast__icon { color: var(--color-success); }
    .toast--error   .toast__icon { color: var(--color-danger); }
    .toast--warning .toast__icon { color: var(--color-warning); }
    .toast--info    .toast__icon { color: var(--color-info); }

    .toast__message {
      flex: 1;
      color: var(--color-text-primary);
      font-weight: var(--font-weight-medium);
    }

    .toast__close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      color: var(--color-text-muted);
      border-radius: var(--radius-sm);
      transition: color 150ms ease, background 150ms ease;
      line-height: 1;
    }

    .toast__close mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .toast__close:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-variant);
    }

    .toast__progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      transition: width 100ms linear;
      border-radius: 0 0 0 var(--radius-lg);
    }

    .toast--success .toast__progress { background: var(--color-success); }
    .toast--error   .toast__progress { background: var(--color-danger); }
    .toast--warning .toast__progress { background: var(--color-warning); }
    .toast--info    .toast__progress { background: var(--color-info); }
  `],
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private sub!: Subscription;

  toasts: ActiveNotification[] = [];

  ngOnInit() {
    this.sub = this.notificationService.notifications$.subscribe((n) => {
      this.add(n);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.toasts.forEach((t) => this.clearTimers(t));
  }

  iconFor(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    return icons[type];
  }

  dismiss(toast: ActiveNotification) {
    this.clearTimers(toast);
    toast.visible = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== toast.id);
      this.cdr.markForCheck();
    }, 230);
  }

  pauseToast(toast: ActiveNotification) {
    this.clearTimers(toast);
  }

  resumeToast(toast: ActiveNotification) {
    const remaining = (toast.progress / 100) * toast.duration;
    this.scheduleTimers(toast, remaining);
  }

  private add(n: AppNotification) {
    const active: ActiveNotification = { ...n, visible: false, progress: 100 };
    this.toasts.push(active);
    this.cdr.markForCheck();

    // trigger enter animation on next tick
    setTimeout(() => {
      active.visible = true;
      this.cdr.markForCheck();
      this.scheduleTimers(active, n.duration);
    }, 16);
  }

  private scheduleTimers(toast: ActiveNotification, duration: number) {
    const steps = 100;
    const interval = duration / steps;
    const decrement = 100 / steps;

    toast.intervalId = setInterval(() => {
      toast.progress = Math.max(0, toast.progress - decrement);
      this.cdr.markForCheck();
    }, interval);

    toast.timeoutId = setTimeout(() => this.dismiss(toast), duration);
  }

  private clearTimers(toast: ActiveNotification) {
    if (toast.intervalId) clearInterval(toast.intervalId);
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
  }
}
