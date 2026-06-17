import { Component, OnDestroy, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

import { AnalyticsService } from '@core/services/analytics.service';
import { ChatHistoryService, ChatSession } from '@core/services/chat-history.service';

interface Mensaje {
  rol: 'usuario' | 'asistente';
  texto: string;
  timestamp: Date;
}

@Component({
  selector: 'app-asistente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './asistente.component.html',
  styleUrls: ['./asistente.component.scss'],
})
export class AsistenteComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef<HTMLDivElement>;

  mensajes: Mensaje[] = [];
  preguntaActual = '';
  cargando = false;
  inputFocused = false;
  private scrollPendiente = false;
  private destroy$ = new Subject<void>();
  private sessionId: string | null = null;

  sugerencias = [
    '¿Cuántas órdenes están pendientes?',
    '¿Cuál fue el ingreso de hoy?',
    '¿Qué repuestos están en stock crítico?',
    '¿Cuál es el rendimiento del equipo técnico?',
  ];

  constructor(
    private analytics: AnalyticsService,
    private historyService: ChatHistoryService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        const session = this.historyService.getSession(id);
        if (session) {
          this.sessionId = id;
          this.mensajes = session.messages.map(m => ({
            rol: m.rol,
            texto: m.texto,
            timestamp: new Date(m.timestamp),
          }));
          this.scrollPendiente = true;
        }
        // id present but session not found yet (mid-creation): don't reset
        return;
      }
      this.sessionId = null;
      this.mensajes = [{
        rol: 'asistente',
        texto: '¡Hola! Soy el asistente de TallerSoft. Podés preguntarme sobre órdenes, stock, ingresos o el rendimiento del equipo técnico.',
        timestamp: new Date(),
      }];
    });
  }

  ngAfterViewChecked(): void {
    if (this.scrollPendiente) {
      this.scrollAlFinal();
      this.scrollPendiente = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  enviar(): void {
    const pregunta = this.preguntaActual.trim();
    if (!pregunta || this.cargando) return;

    this.mensajes.push({ rol: 'usuario', texto: pregunta, timestamp: new Date() });
    this.preguntaActual = '';
    this.cargando = true;
    this.scrollPendiente = true;

    if (!this.sessionId) {
      this.sessionId = this.historyService.generateId();
      // Persist BEFORE navigating so queryParams subscription finds the session
      this.persistSession();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: this.sessionId },
        replaceUrl: true,
      });
    }

    this.analytics
      .consultarAsistente(pregunta)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.mensajes.push({ rol: 'asistente', texto: res.respuesta, timestamp: new Date() });
          this.cargando = false;
          this.scrollPendiente = true;
          this.persistSession();
        },
        error: (err: { status?: number }) => {
          const texto = err?.status === 503
            ? 'El asistente no está disponible en este momento. Intentá de nuevo más tarde.'
            : 'Ocurrió un error al consultar el asistente. Verificá que el servicio de analítica esté activo.';
          this.mensajes.push({
            rol: 'asistente',
            texto,
            timestamp: new Date(),
          });
          this.cargando = false;
          this.scrollPendiente = true;
          this.persistSession();
        },
      });
  }

  private persistSession(): void {
    if (!this.sessionId) return;
    const userMessages = this.mensajes.filter(m => m.rol === 'usuario');
    const title = userMessages.length > 0
      ? userMessages[0].texto.slice(0, 48) + (userMessages[0].texto.length > 48 ? '…' : '')
      : 'Nueva conversación';

    const session: ChatSession = {
      id: this.sessionId,
      title,
      messages: this.mensajes.map(m => ({
        rol: m.rol,
        texto: m.texto,
        timestamp: m.timestamp.toISOString(),
      })),
      createdAt: this.mensajes[0].timestamp.toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.historyService.saveSession(session);
  }

  usarSugerencia(texto: string): void {
    this.preguntaActual = texto;
    this.enviar();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  private scrollAlFinal(): void {
    if (this.mensajesContainer) {
      const el = this.mensajesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
