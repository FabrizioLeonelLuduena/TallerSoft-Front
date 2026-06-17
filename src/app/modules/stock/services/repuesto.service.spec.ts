import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RepuestosService, RepuestoRequest } from '../../ordenes/services/repuestos.service';
import { environment } from '@environments/environment';

describe('RepuestosService', () => {
  let service: RepuestosService;
  let httpMock: HttpTestingController;
  const api = `${environment.apiUrl}/api/repuestos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RepuestosService]
    });
    service = TestBed.inject(RepuestosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getRepuestos_llamaAlEndpointCorrecto', () => {
    service.listarRepuestos().subscribe();

    const req = httpMock.expectOne(api);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('critico')).toBeFalse();
    req.flush([]);
  });

  it('getRepuestosCriticos_pasaParametroCritico', () => {
    service.listarRepuestos(true).subscribe();

    const req = httpMock.expectOne(`${api}?critico=true`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('critico')).toBe('true');
    req.flush([]);
  });

  it('crearRepuesto_enviaRequestCorrectamente', () => {
    const payload: RepuestoRequest = {
      nombre: 'Pantalla OLED iPhone 13',
      categoria: 'Pantallas',
      precio: 45000,
      stockActual: 10,
      stockMinimo: 5,
      stockBajo: 3
    };

    service.crearRepuesto(payload).subscribe();

    const req = httpMock.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, ...payload, critico: false });
  });
});
