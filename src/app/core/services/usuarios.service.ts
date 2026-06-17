import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'TECNICO' | 'RECEPCION';
  activo: boolean;
  createdAt: string;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'TECNICO' | 'RECEPCION';
}

export interface UsuarioUpdateRequest {
  nombre?: string;
  email?: string;
  rol?: 'ADMIN' | 'TECNICO' | 'RECEPCION';
  activo?: boolean;
}

/**
 * Usuarios Service
 * Handles all user management operations (CRUD)
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private readonly apiUrl = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users
   * Only ADMIN can access this endpoint
   */
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  /**
   * Get user by ID
   */
  obtenerUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new user
   * Only ADMIN can create users
   */
  crearUsuario(request: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, request);
  }

  /**
   * Update user
   * ADMIN can update any user, users can update their own data
   */
  actualizarUsuario(id: number, request: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Soft delete user (set activo = false)
   * Only ADMIN can delete users
   */
  desactivarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get users by role filter
   */
  obtenerUsuariosPorRol(rol: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}?rol=${rol}`);
  }
}
