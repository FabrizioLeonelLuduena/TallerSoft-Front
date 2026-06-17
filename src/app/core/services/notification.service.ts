import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications$ = new Subject<AppNotification>();
  notifications$ = this._notifications$.asObservable();

  success(message: string, duration = 3500) {
    this.emit('success', message, duration);
  }

  error(message: string, duration = 4500) {
    this.emit('error', message, duration);
  }

  warning(message: string, duration = 4000) {
    this.emit('warning', message, duration);
  }

  info(message: string, duration = 3500) {
    this.emit('info', message, duration);
  }

  private emit(type: NotificationType, message: string, duration: number) {
    this._notifications$.next({
      id: crypto.randomUUID(),
      type,
      message,
      duration,
    });
  }
}
