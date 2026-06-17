import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface EquipoResponse {
  id: number;
  clienteId: number;
  tipo: string;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  observaciones?: string | null;
  descripcion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private api = `${environment.apiUrl}/api/equipos`;

  constructor(private http: HttpClient) {}

  listarEquiposDelCliente(clienteId: number): Observable<EquipoResponse[]> {
    return this.http.get<EquipoResponse[]>(`${this.api}/cliente/${clienteId}`);
  }

  crearEquipo(equipo: any): Observable<EquipoResponse> {
    return this.http.post<EquipoResponse>(`${this.api}`, equipo);
  }

  editarEquipo(id: number, equipo: any): Observable<EquipoResponse> {
    return this.http.put<EquipoResponse>(`${this.api}/${id}`, equipo);
  }

  eliminarEquipo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
