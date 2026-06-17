import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface OrdenRepuestoResponse {
  id: number;
  repuestoId: number;
  nombreRepuesto: string;
  cantidad: number;
  precioUnit: number;
  total: number;
}

export interface OrdenTrabajoResponse {
  id: number;
  equipoId: number;
  clienteId: number;
  clienteNombre: string;
  tecnicoId: number | null;
  tecnicoNombre: string | null;
  fallaReportada: string;
  diagnostico: string | null;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA';
  presupuesto: number;
  createdAt: string;
  updatedAt: string;
  repuestos: OrdenRepuestoResponse[];
}

export interface OrdenTrabajoRequest {
  equipoId: number;
  clienteId: number;
  tecnicoId?: number | null;
  fallaReportada: string;
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA';
}

export interface CambiarEstadoRequest {
  nuevoEstado: 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
}

export interface DiagnosticoRequest {
  diagnostico: string;
}

export interface AgregarRepuestoRequest {
  repuestoId: number;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class OrdenesService {
  private api = `${environment.apiUrl}/api/ordenes`;

  constructor(private http: HttpClient) {}

  listarOrdenes(filtros?: { estado?: string; tecnicoId?: number }): Observable<OrdenTrabajoResponse[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.tecnicoId) params = params.set('tecnicoId', filtros.tecnicoId.toString());
    }
    return this.http.get<OrdenTrabajoResponse[]>(this.api, { params });
  }

  listarOrdenesActivas(): Observable<OrdenTrabajoResponse[]> {
    return this.http.get<OrdenTrabajoResponse[]>(`${this.api}/activas`);
  }

  listarMisOrdenes(): Observable<OrdenTrabajoResponse[]> {
    return this.http.get<OrdenTrabajoResponse[]>(`${this.api}/mis-ordenes`);
  }

  obtenerOrden(id: number): Observable<OrdenTrabajoResponse> {
    return this.http.get<OrdenTrabajoResponse>(`${this.api}/${id}`);
  }

  crearOrden(data: OrdenTrabajoRequest): Observable<OrdenTrabajoResponse> {
    return this.http.post<OrdenTrabajoResponse>(this.api, data);
  }

  cambiarEstado(id: number, nuevoEstado: string): Observable<OrdenTrabajoResponse> {
    return this.http.put<OrdenTrabajoResponse>(`${this.api}/${id}/estado`, { nuevoEstado });
  }

  agregarDiagnostico(id: number, diagnostico: string): Observable<OrdenTrabajoResponse> {
    return this.http.put<OrdenTrabajoResponse>(`${this.api}/${id}/diagnostico`, { diagnostico });
  }

  agregarRepuesto(ordenId: number, data: AgregarRepuestoRequest): Observable<OrdenTrabajoResponse> {
    return this.http.post<OrdenTrabajoResponse>(`${this.api}/${ordenId}/repuestos`, data);
  }

  eliminarRepuesto(ordenId: number, ordenRepuestoId: number): Observable<OrdenTrabajoResponse> {
    return this.http.delete<OrdenTrabajoResponse>(`${this.api}/${ordenId}/repuestos/${ordenRepuestoId}`);
  }

  listarOrdenesPorCliente(clienteId: number): Observable<OrdenTrabajoResponse[]> {
    return this.http.get<OrdenTrabajoResponse[]>(`${this.api}/cliente/${clienteId}`);
  }

  eliminarOrden(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
