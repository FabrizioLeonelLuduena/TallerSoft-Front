import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdenesService } from './ordenes.service';
import { environment } from '@environments/environment';

describe('OrdenesService', () => {
  let service: OrdenesService;
  let httpMock: HttpTestingController;
  const api = `${environment.apiUrl}/api/ordenes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrdenesService],
    });
    service = TestBed.inject(OrdenesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── listarOrdenes ────────────────────────────────────────────────────────

  it('listarOrdenes: hace GET a /api/ordenes sin parámetros', () => {
    service.listarOrdenes().subscribe();

    const req = httpMock.expectOne(api);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listarOrdenes: envía query params de filtros correctamente', () => {
    service.listarOrdenes({ estado: 'PENDIENTE', tecnicoId: 5 }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url === api &&
      r.params.get('estado') === 'PENDIENTE' &&
      r.params.get('tecnicoId') === '5'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listarOrdenes: filtra solo por estado cuando no hay tecnicoId', () => {
    service.listarOrdenes({ estado: 'LISTO' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url === api && r.params.get('estado') === 'LISTO' && !r.params.has('tecnicoId')
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // ── cambiarEstado ────────────────────────────────────────────────────────

  it('cambiarEstado: hace PUT a /api/ordenes/{id}/estado con el nuevo estado', () => {
    service.cambiarEstado(42, 'LISTO').subscribe();

    const req = httpMock.expectOne(`${api}/42/estado`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nuevoEstado: 'LISTO' });
    req.flush({});
  });

  it('cambiarEstado: usa la URL correcta para distintos ids', () => {
    service.cambiarEstado(1, 'EN_PROCESO').subscribe();

    const req = httpMock.expectOne(`${api}/1/estado`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  // ── obtenerOrden ─────────────────────────────────────────────────────────

  it('obtenerOrden: hace GET a /api/ordenes/{id}', () => {
    service.obtenerOrden(10).subscribe();

    const req = httpMock.expectOne(`${api}/10`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  // ── listarOrdenesActivas ─────────────────────────────────────────────────

  it('listarOrdenesActivas: hace GET a /api/ordenes/activas', () => {
    service.listarOrdenesActivas().subscribe();

    const req = httpMock.expectOne(`${api}/activas`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
