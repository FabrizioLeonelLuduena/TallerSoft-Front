import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface ClienteRequest {
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export interface ClienteResponse {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private api = `${environment.apiUrl}/api/clientes`;

  constructor(private http: HttpClient) {}

  listarClientes(nombre?: string, incluirInactivos = false): Observable<ClienteResponse[]> {
    let params = new HttpParams();
    if (nombre) params = params.set('nombre', nombre);
    if (incluirInactivos) params = params.set('incluirInactivos', 'true');
    return this.http.get<ClienteResponse[]>(this.api, { params }).pipe(
      catchError(err => { throw err; })
    );
  }

  obtenerCliente(id: number): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.api}/${id}`);
  }

  crearCliente(data: ClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.api, data);
  }

  editarCliente(id: number, data: ClienteRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.api}/${id}`, data);
  }

  reactivarCliente(id: number): Observable<void> {
    return this.http.patch<void>(`${this.api}/${id}/activar`, {});
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
