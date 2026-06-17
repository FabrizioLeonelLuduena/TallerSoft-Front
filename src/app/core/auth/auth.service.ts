import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { ProfileService } from '@core/services/profile.service';
import { ChatHistoryService } from '@core/services/chat-history.service';
import { UsuarioResponse } from '@app/modules/usuarios/services/usuario.service';

const log = (...args: any[]) => { if (!environment.production) console.log(...args); };

export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  rol: string;
}

export interface CurrentUser {
  userId: number;
  email: string;
  rol: string;
}

/**
 * Authentication Service
 * Handles user login, logout, token management, and JWT storage
 * Token is stored in sessionStorage only (never localStorage)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private profileService: ProfileService,
    private chatHistoryService: ChatHistoryService,
  ) {
    const existing = this.getCurrentUser();
    if (existing) {
      this.profileService.init(existing.userId);
      this.chatHistoryService.init(existing.userId);
      // Defer to avoid interceptor circular-init during construction
      setTimeout(() => this.loadAvatarFromBackend(existing.userId), 0);
    }
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<LoginResponse> {
    log('[AuthService] Starting login process for:', email);
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      map(response => {
        log('[AuthService] Login response received, userId:', response.userId);
        this.profileService.init(response.userId);
        this.chatHistoryService.init(response.userId);
        this.setToken(response.token);
        this.loadAvatarFromBackend(response.userId);
        this.currentUserSubject.next(this.getCurrentUser());
        return response;
      })
    );
  }

  private loadAvatarFromBackend(userId: number): void {
    this.http.get<UsuarioResponse>(`${environment.apiUrl}/api/usuarios/${userId}`)
      .subscribe({
        next: (u) => this.profileService.update({ avatarImage: u.avatarImage ?? null }),
        error: () => {}
      });
  }

  /**
   * Logout and clear token
   */
  logout(): void {
    sessionStorage.removeItem('token');
    this.profileService.reset();
    this.chatHistoryService.reset();
    this.currentUserSubject.next(null);
  }

  /**
   * Store JWT token in sessionStorage (NEVER localStorage)
   */
  setToken(token: string): void {
    sessionStorage.setItem('token', token);
  }

  /**
   * Get JWT token from sessionStorage
   */
  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Get current user from decoded JWT token
   */
  getCurrentUser(): CurrentUser | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);
      return {
        userId: payload.userId,
        email: payload.email,
        rol: payload.rol
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get current user role
   */
  getCurrentRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.rol : null;
  }

  /**
   * Decode JWT token (basic decoding, doesn't verify signature)
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }
}
