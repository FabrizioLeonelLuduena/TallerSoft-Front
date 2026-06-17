import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  rol: 'usuario' | 'asistente';
  texto: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const BASE_KEY = 'tallersoft_chat';

@Injectable({ providedIn: 'root' })
export class ChatHistoryService {
  private sessions$ = new BehaviorSubject<ChatSession[]>([]);
  private storageKey = BASE_KEY;

  get sessions() {
    return this.sessions$.asObservable();
  }

  get sessionsList(): ChatSession[] {
    return this.sessions$.value;
  }

  /** Llamar tras login: carga el historial del usuario autenticado. */
  init(userId: number | string): void {
    this.storageKey = `${BASE_KEY}_${userId}`;
    this.load();
  }

  /** Llamar en logout: vacía la sesión en memoria sin tocar localStorage. */
  reset(): void {
    this.storageKey = BASE_KEY;
    this.sessions$.next([]);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.sessions$.next(raw ? JSON.parse(raw) : []);
    } catch {
      this.sessions$.next([]);
    }
  }

  private persist(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.sessions$.value));
  }

  getSession(id: string): ChatSession | undefined {
    return this.sessions$.value.find(s => s.id === id);
  }

  saveSession(session: ChatSession): void {
    const list = this.sessions$.value.filter(s => s.id !== session.id);
    list.unshift(session);
    this.sessions$.next(list);
    this.persist();
  }

  deleteSession(id: string): void {
    const list = this.sessions$.value.filter(s => s.id !== id);
    this.sessions$.next(list);
    this.persist();
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
