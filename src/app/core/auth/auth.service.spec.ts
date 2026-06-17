import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { ProfileService } from '@core/services/profile.service';
import { ChatHistoryService } from '@core/services/chat-history.service';
import { environment } from '@environments/environment';

const profileServiceStub = { init: () => {}, update: () => {}, reset: () => {} };
const chatHistoryServiceStub = { init: () => {}, reset: () => {} };

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockToken =
    'eyJhbGciOiJIUzI1NiJ9.' +
    btoa(JSON.stringify({ userId: 1, email: 'admin@test.com', rol: 'ADMIN', exp: 9999999999 })).replace(/=/g, '') +
    '.signature';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: ProfileService, useValue: profileServiceStub },
        { provide: ChatHistoryService, useValue: chatHistoryServiceStub },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  // ── login ────────────────────────────────────────────────────────────────

  it('login: hace POST a /auth/login y almacena token en sessionStorage (nunca localStorage)', () => {
    const setItemSpy = spyOn(sessionStorage, 'setItem').and.callThrough();
    const localStorageSpy = spyOn(localStorage, 'setItem');

    service.login('admin@test.com', 'admin123').subscribe(resp => {
      expect(resp.token).toBe(mockToken);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'admin123' });

    req.flush({ token: mockToken, userId: 1, email: 'admin@test.com', rol: 'ADMIN' });

    // login() dispara loadAvatarFromBackend() que hace GET /api/usuarios/{id}
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/1`).flush({});

    expect(setItemSpy).toHaveBeenCalledWith('token', mockToken);
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it('login: retorna la respuesta completa del servidor', () => {
    const loginResp = { token: mockToken, userId: 1, email: 'admin@test.com', rol: 'ADMIN' };

    service.login('admin@test.com', 'admin123').subscribe(resp => {
      expect(resp).toEqual(loginResp);
    });

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResp);

    // login() dispara loadAvatarFromBackend() que hace GET /api/usuarios/{id}
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/1`).flush({});
  });

  // ── logout ───────────────────────────────────────────────────────────────

  it('logout: limpia sessionStorage', () => {
    sessionStorage.setItem('token', mockToken);

    service.logout();

    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('logout: currentUser$ emite null después del logout', (done) => {
    sessionStorage.setItem('token', mockToken);

    service.logout();

    service.currentUser$.subscribe(user => {
      expect(user).toBeNull();
      done();
    });
  });

  // ── isLoggedIn ───────────────────────────────────────────────────────────

  it('isLoggedIn: retorna true si hay token en sessionStorage', () => {
    sessionStorage.setItem('token', mockToken);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('isLoggedIn: retorna false si no hay token', () => {
    sessionStorage.removeItem('token');
    expect(service.isLoggedIn()).toBeFalse();
  });

  // ── getCurrentRole ───────────────────────────────────────────────────────

  it('getCurrentRole: extrae el rol correctamente del payload JWT', () => {
    sessionStorage.setItem('token', mockToken);
    expect(service.getCurrentRole()).toBe('ADMIN');
  });

  it('getCurrentRole: retorna null si no hay token', () => {
    sessionStorage.removeItem('token');
    expect(service.getCurrentRole()).toBeNull();
  });

  // ── getToken ─────────────────────────────────────────────────────────────

  it('getToken: retorna el token guardado en sessionStorage', () => {
    sessionStorage.setItem('token', mockToken);
    expect(service.getToken()).toBe(mockToken);
  });

  it('getToken: retorna null cuando no hay token', () => {
    expect(service.getToken()).toBeNull();
  });

  // ── nunca usa localStorage ───────────────────────────────────────────────

  it('setToken: guarda en sessionStorage, NO en localStorage', () => {
    const localStorageSpy = spyOn(localStorage, 'setItem');

    service.setToken(mockToken);

    expect(sessionStorage.getItem('token')).toBe(mockToken);
    expect(localStorageSpy).not.toHaveBeenCalled();
  });
});
