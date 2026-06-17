import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../auth/auth.service';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  const validToken = 'eyJhbGciOiJIUzI1NiJ9.payload.signature';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('con token en sessionStorage → agrega Authorization header', () => {
    spyOn(authService, 'getToken').and.returnValue(validToken);

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
    req.flush({});
  });

  it('sin token → no agrega Authorization header', () => {
    spyOn(authService, 'getToken').and.returnValue(null);

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('respuesta 401 → llama logout y redirige a /login', () => {
    spyOn(authService, 'getToken').and.returnValue(validToken);
    const logoutSpy = spyOn(authService, 'logout');
    const navigateSpy = spyOn(router, 'navigate');

    http.get('/api/protected').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('errores distintos a 401 → no llama logout', () => {
    spyOn(authService, 'getToken').and.returnValue(validToken);
    const logoutSpy = spyOn(authService, 'logout');

    http.get('/api/resource').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/resource');
    req.flush({ error: 'Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(logoutSpy).not.toHaveBeenCalled();
  });
});
