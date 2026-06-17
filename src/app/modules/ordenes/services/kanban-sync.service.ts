import { Injectable } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface KanbanUpdate {
  ordenId: number;
  nuevoEstado: string;
}

@Injectable({ providedIn: 'root' })
export class KanbanSyncService {
  private rxStomp = new RxStomp();

  constructor() {
    const token = sessionStorage.getItem('token') ?? '';
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';

    const config: RxStompConfig = {
      brokerURL: `ws://${host}${port}/ws/websocket?token=${token}`,
      reconnectDelay: 5000,
    };

    this.rxStomp.configure(config);
    this.rxStomp.activate();
  }

  kanbanUpdates$(): Observable<KanbanUpdate> {
    return this.rxStomp
      .watch('/topic/kanban')
      .pipe(map(message => JSON.parse(message.body) as KanbanUpdate));
  }

  disconnect(): void {
    this.rxStomp.deactivate();
  }
}
