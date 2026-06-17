import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export type MedioPago = 'EFECTIVO' | 'TARJETA' | 'MERCADOPAGO';
export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface CobrarOrdenRequest {
  ordenId: number;
  monto: number;
  montoRecibido?: number;
  medioPago: MedioPago;
}

export interface CobroResponse {
  id: number;
  ordenId: number;
  clienteNombre: string;
  monto: number;
  montoRecibido?: number;
  vuelto?: number;
  medioPago: MedioPago;
  estadoPago: EstadoPago;
  mpLinkPago?: string;
  mpQrBase64?: string;
  mpQrImageUrl?: string;
  createdAt: string;
}

export interface CajaDiariaResponse {
  fecha: string;
  totalDia: number;
  cantidadOrdenes: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalMercadoPago: number;
  cobrosDelDia: CobroResponse[];
}

@Injectable({ providedIn: 'root' })
export class CobrosService {
  private api = `${environment.apiUrl}/api/cobros`;

  constructor(private http: HttpClient) {}

  registrarCobro(request: CobrarOrdenRequest): Observable<CobroResponse> {
    return this.http.post<CobroResponse>(this.api, request);
  }

  getCajaDiaria(fecha?: string): Observable<CajaDiariaResponse> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<CajaDiariaResponse>(`${this.api}/caja-diaria`, { params });
  }

  confirmarPagoManual(cobroId: number): Observable<CobroResponse> {
    return this.http.post<CobroResponse>(`${this.api}/${cobroId}/confirmar`, {});
  }

  getHistorialCajas(anio?: number, mes?: number): Observable<CajaDiariaResponse[]> {
    let params = new HttpParams();
    if (anio) params = params.set('anio', anio.toString());
    if (mes)  params = params.set('mes',  mes.toString());
    return this.http.get<CajaDiariaResponse[]>(`${this.api}/historial`, { params });
  }

  getCobro(cobroId: number): Observable<CobroResponse> {
    return this.http.get<CobroResponse>(`${this.api}/${cobroId}`);
  }

  generarPresupuesto(ordenId: number): Observable<Blob> {
    return this.http.get(`${this.api}/ordenes/${ordenId}/presupuesto-pdf`, {
      responseType: 'blob'
    });
  }
}
