import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface ResumenOrdenes {
  pendientes: number;
  en_proceso: number;
  listas: number;
  entregadas: number;
  total: number;
}

export interface OrdenesPorPeriodo {
  periodo: string;
  cantidad: number;
}

export interface RendimientoTecnico {
  tecnico_id: number;
  nombre: string;
  ordenes_cerradas: number;
  tiempo_promedio_dias: number;
}

export interface RepuestoCritico {
  id: number;
  nombre: string;
  categoria: string | null;
  stock_actual: number;
  stock_minimo: number;
  diferencia: number;
}

export interface DesgloseMedioPago {
  medio_pago: string;
  total: number;
  cantidad: number;
}

export interface ResumenCajaDiario {
  fecha: string;
  total_ingresos: number;
  cantidad_cobros: number;
  desglose: DesgloseMedioPago[];
}

export interface EvolucionMensual {
  mes: string;
  total_ingresos: number;
  cantidad_cobros: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private base = `${environment.analyticsUrl}/analytics`;
  private apiBase = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getResumenOrdenes(): Observable<ResumenOrdenes> {
    return this.http.get<ResumenOrdenes>(`${this.base}/ordenes/resumen`);
  }

  getOrdenesPorPeriodo(agrupacion: 'semana' | 'mes' = 'mes', mesesAtras = 6): Observable<OrdenesPorPeriodo[]> {
    const params = new HttpParams()
      .set('agrupacion', agrupacion)
      .set('meses_atras', mesesAtras);
    return this.http.get<OrdenesPorPeriodo[]>(`${this.base}/ordenes/por-periodo`, { params });
  }

  getRendimientoTecnicos(mesActual = true): Observable<RendimientoTecnico[]> {
    const params = new HttpParams().set('mes_actual', mesActual);
    return this.http.get<RendimientoTecnico[]>(`${this.base}/ordenes/tecnicos/rendimiento`, { params });
  }

  getStockCritico(): Observable<RepuestoCritico[]> {
    return this.http.get<RepuestoCritico[]>(`${this.base}/stock/critico`);
  }

  getResumenCajaDiario(fecha?: string): Observable<ResumenCajaDiario> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<ResumenCajaDiario>(`${this.base}/caja/resumen-diario`, { params });
  }

  getEvolucionMensual(meses = 6): Observable<EvolucionMensual[]> {
    const params = new HttpParams().set('meses', meses);
    return this.http.get<EvolucionMensual[]>(`${this.base}/caja/evolucion-mensual`, { params });
  }

  consultarAsistente(pregunta: string): Observable<{ respuesta: string; contexto_utilizado: any }> {
    return this.http.post<{ respuesta: string; contexto_utilizado: any }>(
      `${this.base}/asistente/consulta`,
      { pregunta }
    );
  }

  // ─── Nuevos endpoints ────────────────────────────────────────────────────

  getOrdenesSinMovimiento(diasUmbral = 5): Observable<any[]> {
    const params = new HttpParams().set('dias_umbral', diasUmbral);
    return this.http.get<any[]>(`${this.base}/ordenes/sin-movimiento`, { params });
  }

  getOrdenesAltaPrioridad(diasMinimos = 1): Observable<any[]> {
    const params = new HttpParams().set('dias_minimos', diasMinimos);
    return this.http.get<any[]>(`${this.base}/ordenes/alta-prioridad`, { params });
  }

  getTiempoPorEstado(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/ordenes/tiempo-por-estado`);
  }

  getRechazos(dias = 7): Observable<any> {
    const params = new HttpParams().set('dias', dias);
    return this.http.get<any>(`${this.base}/caja/rechazos`, { params });
  }

  getConversionPresupuesto(): Observable<any> {
    return this.http.get<any>(`${this.base}/caja/conversion-presupuesto`);
  }

  getRecurrenciaClientes(meses = 6): Observable<any[]> {
    const params = new HttpParams().set('meses', meses);
    return this.http.get<any[]>(`${this.base}/clientes/recurrencia`, { params });
  }

  getStockPorCategoria(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/stock/por-categoria`);
  }

  getAlertasActivas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alertas/activas`);
  }

  getResumenAlertas(): Observable<any> {
    return this.http.get<any>(`${this.base}/alertas/resumen`);
  }

  /** Retorna las alertaKeys que el usuario autenticado ya leyó (persiste en BD). */
  getAlertasLeidas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiBase}/alertas/leidas`);
  }

  /** Marca una alerta como leída para el usuario autenticado (persiste en BD). */
  marcarAlertaLeida(alertaKey: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/alertas/${alertaKey}/leer`, {});
  }
}
