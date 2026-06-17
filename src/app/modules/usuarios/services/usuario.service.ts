import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface UsuarioUpdateRequest {
  nombre: string;
  email: string;
  telefono?: string;
  password?: string;
  currentPassword?: string;
  rol: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'ADMIN' | 'TECNICO' | 'RECEPCION';
  activo: boolean;
  createdAt: string;
  avatarImage?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/api/usuarios`;
  private authApi = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users with optional role filter
   */
  listarUsuarios(rol?: string): Observable<UsuarioResponse[]> {
    let params = new HttpParams();
    if (rol) {
      params = params.set('rol', rol);
    }
    return this.http.get<UsuarioResponse[]>(this.apiUrl, { params });
  }

  /**
   * Create a new user via /auth/register endpoint
   */
  crearUsuario(data: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.authApi}/register`, data);
  }

  /**
   * Get a single user by ID
   */
  obtenerUsuario(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update a user by ID
   */
  editarUsuario(usuarioId: number, data: UsuarioUpdateRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${usuarioId}`, data);
  }

  /**
   * Delete a user by ID
   */
  deleteUsuario(usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${usuarioId}`);
  }

  activarUsuario(usuarioId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${usuarioId}/activar`, {});
  }

  saveAvatar(usuarioId: number, avatarImage: string | null): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${usuarioId}/avatar`, { avatarImage });
  }
}
