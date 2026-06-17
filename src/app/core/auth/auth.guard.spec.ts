import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/ordenes' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [AuthGuard, AuthService],
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('usuario autenticado → canActivate retorna true', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(true);

    const result = guard.canActivate(mockRoute, mockState);

    expect(result).toBeTrue();
  });

  it('usuario sin token → canActivate retorna false y redirige a /login', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(false);
    const navigateSpy = spyOn(router, 'navigate');

    const result = guard.canActivate(mockRoute, mockState);

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], jasmine.objectContaining({
      queryParams: { returnUrl: '/ordenes' }
    }));
  });
});

describe('RoleGuard', () => {
  let guard: import('./role.guard').RoleGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [AuthService],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('usuario con rol correcto → accede', async () => {
    const { RoleGuard } = await import('./role.guard');
    guard = TestBed.runInInjectionContext(() => new RoleGuard(authService, router));
    spyOn(authService, 'getCurrentRole').and.returnValue('ADMIN');

    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/admin' } as RouterStateSnapshot;

    const result = guard.canActivate(route, state);
    expect(result).toBeTrue();
  });

  it('usuario TECNICO accediendo a ruta de ADMIN → retorna false y redirige', async () => {
    const { RoleGuard } = await import('./role.guard');
    guard = TestBed.runInInjectionContext(() => new RoleGuard(authService, router));
    spyOn(authService, 'getCurrentRole').and.returnValue('TECNICO');
    const navigateSpy = spyOn(router, 'navigate');

    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/admin/usuarios' } as RouterStateSnapshot;

    const result = guard.canActivate(route, state);
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/unauthorized']);
  });
});
