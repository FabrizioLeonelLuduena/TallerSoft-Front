import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CobrarOrdenComponent } from './cobrar-orden.component';
import { OrdenesService } from '../../../ordenes/services/ordenes.service';
import { CobrosService } from '../../services/cobros.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

const mockOrden = {
  id: 1,
  equipoId: 1,
  clienteId: 1,
  clienteNombre: 'Juan Pérez',
  tecnicoId: 2,
  tecnicoNombre: 'Carlos',
  fallaReportada: 'Pantalla rota',
  diagnostico: 'Cambio de pantalla',
  estado: 'LISTO' as const,
  prioridad: 'NORMAL' as const,
  presupuesto: 5000,
  createdAt: '2025-01-01T10:00:00',
  updatedAt: '2025-01-02T10:00:00',
  repuestos: [],
};

describe('CobrarOrdenComponent', () => {
  let component: CobrarOrdenComponent;
  let fixture: ComponentFixture<CobrarOrdenComponent>;
  let ordenesService: jasmine.SpyObj<OrdenesService>;
  let cobrosService: jasmine.SpyObj<CobrosService>;

  beforeEach(async () => {
    const ordenesSpy = jasmine.createSpyObj('OrdenesService', ['obtenerOrden']);
    const cobrosSpy = jasmine.createSpyObj('CobrosService', ['registrarCobro', 'getCobro']);
    ordenesSpy.obtenerOrden.and.returnValue(of(mockOrden));

    await TestBed.configureTestingModule({
      imports: [
        CobrarOrdenComponent,
        RouterTestingModule,
        MatSnackBarModule,
        HttpClientTestingModule,
        MatIconModule,
        FormsModule,
      ],
      providers: [
        { provide: OrdenesService, useValue: ordenesSpy },
        { provide: CobrosService, useValue: cobrosSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CobrarOrdenComponent);
    component = fixture.componentInstance;
    ordenesService = TestBed.inject(OrdenesService) as jasmine.SpyObj<OrdenesService>;
    cobrosService = TestBed.inject(CobrosService) as jasmine.SpyObj<CobrosService>;
    fixture.detectChanges();
  });

  it('crea el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('carga la orden al inicializar', () => {
    expect(ordenesService.obtenerOrden).toHaveBeenCalledWith(1);
    expect(component.orden).toEqual(mockOrden);
  });

  // ── Selección de medio de pago ───────────────────────────────────────────

  it('seleccionarMedio EFECTIVO: muestra campo de monto recibido en el template', () => {
    component.seleccionarMedio('EFECTIVO');
    fixture.detectChanges();

    expect(component.medioPago).toBe('EFECTIVO');
    expect(component.montoRecibido).toBeNull();
  });

  it('seleccionarMedio MERCADOPAGO: cambia medio de pago', () => {
    component.seleccionarMedio('MERCADOPAGO');
    expect(component.medioPago).toBe('MERCADOPAGO');
  });

  it('seleccionarMedio TARJETA: cambia medio de pago', () => {
    component.seleccionarMedio('TARJETA');
    expect(component.medioPago).toBe('TARJETA');
  });

  // ── Cálculo de vuelto ────────────────────────────────────────────────────

  it('vuelto: calcula correctamente (montoRecibido - presupuesto)', () => {
    component.medioPago = 'EFECTIVO';
    component.montoRecibido = 6000;
    // presupuesto = 5000
    expect(component.vuelto).toBe(1000);
  });

  it('vuelto: retorna 0 si el monto recibido es igual al presupuesto', () => {
    component.medioPago = 'EFECTIVO';
    component.montoRecibido = 5000;
    expect(component.vuelto).toBe(0);
  });

  it('vuelto: retorna 0 para medio de pago TARJETA', () => {
    component.medioPago = 'TARJETA';
    component.montoRecibido = 6000;
    expect(component.vuelto).toBe(0);
  });

  // ── Validación de monto insuficiente ─────────────────────────────────────

  it('montoInsuficiente: true cuando montoRecibido < presupuesto', () => {
    component.medioPago = 'EFECTIVO';
    component.montoRecibido = 3000;
    expect(component.montoInsuficiente).toBeTrue();
  });

  it('montoInsuficiente: false cuando montoRecibido >= presupuesto', () => {
    component.medioPago = 'EFECTIVO';
    component.montoRecibido = 5000;
    expect(component.montoInsuficiente).toBeFalse();
  });

  it('montoInsuficiente: false para medio TARJETA (no aplica validación de monto)', () => {
    component.medioPago = 'TARJETA';
    component.montoRecibido = 100;
    expect(component.montoInsuficiente).toBeFalse();
  });
});
