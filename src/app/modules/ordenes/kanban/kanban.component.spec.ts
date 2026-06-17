import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanComponent } from './kanban.component';
import { OrdenesService, OrdenTrabajoResponse } from '../services/ordenes.service';
import { KanbanSyncService } from '../services/kanban-sync.service';
import { NotificationService } from '../../../core/services/notification.service';
import { of, throwError, EMPTY } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const makeOrden = (id: number, estado: OrdenTrabajoResponse['estado']): OrdenTrabajoResponse => ({
  id,
  equipoId: 1,
  clienteId: 1,
  clienteNombre: `Cliente ${id}`,
  tecnicoId: null,
  tecnicoNombre: null,
  fallaReportada: 'Falla de prueba',
  diagnostico: null,
  estado,
  prioridad: 'NORMAL',
  presupuesto: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  repuestos: [],
});

const kanbanSyncStub = {
  kanbanUpdates$: () => EMPTY,
  disconnect: () => {},
};

describe('KanbanComponent', () => {
  let component: KanbanComponent;
  let fixture: ComponentFixture<KanbanComponent>;
  let ordenesService: jasmine.SpyObj<OrdenesService>;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('OrdenesService', [
      'listarOrdenesActivas',
      'cambiarEstado',
    ]);
    serviceSpy.listarOrdenesActivas.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        KanbanComponent,
        DragDropModule,
        RouterTestingModule,
        MatIconModule,
        MatButtonModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: OrdenesService, useValue: serviceSpy },
        { provide: KanbanSyncService, useValue: kanbanSyncStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanComponent);
    component = fixture.componentInstance;
    ordenesService = TestBed.inject(OrdenesService) as jasmine.SpyObj<OrdenesService>;
    notificationService = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  it('inicializa con 4 columnas (PENDIENTE, EN_PROCESO, LISTO, ENTREGADO)', () => {
    const estados = component.columns.map(c => c.estado);
    expect(estados).toContain('PENDIENTE');
    expect(estados).toContain('EN_PROCESO');
    expect(estados).toContain('LISTO');
    expect(estados).toContain('ENTREGADO');
    expect(component.columns.length).toBe(4);
  });

  it('setFilteredOrdenes: distribuye órdenes en las columnas correctas', () => {
    const ordenes: OrdenTrabajoResponse[] = [
      makeOrden(1, 'PENDIENTE'),
      makeOrden(2, 'PENDIENTE'),
      makeOrden(3, 'EN_PROCESO'),
      makeOrden(4, 'LISTO'),
    ];

    component.setFilteredOrdenes(ordenes);

    const pendienteCol = component.columns.find(c => c.estado === 'PENDIENTE')!;
    const enProcesoCol = component.columns.find(c => c.estado === 'EN_PROCESO')!;
    const listoCol = component.columns.find(c => c.estado === 'LISTO')!;

    expect(pendienteCol.ordenes.length).toBe(2);
    expect(enProcesoCol.ordenes.length).toBe(1);
    expect(listoCol.ordenes.length).toBe(1);
  });

  it('setFilteredOrdenes: ordenes ENTREGADO aparecen en columna ENTREGADO', () => {
    const ordenes: OrdenTrabajoResponse[] = [
      makeOrden(5, 'ENTREGADO'),
      makeOrden(6, 'ENTREGADO'),
    ];

    component.setFilteredOrdenes(ordenes);

    const entregadoCol = component.columns.find(c => c.estado === 'ENTREGADO')!;
    expect(entregadoCol.ordenes.length).toBe(2);
  });

  it('loadOrdenes: llama a listarOrdenesActivas y distribuye órdenes', () => {
    const ordenes = [makeOrden(1, 'PENDIENTE'), makeOrden(2, 'EN_PROCESO')];
    ordenesService.listarOrdenesActivas.and.returnValue(of(ordenes));

    component.loadOrdenes();

    expect(ordenesService.listarOrdenesActivas).toHaveBeenCalled();
  });

  it('loadOrdenes: error del servidor → llama notifications.error', () => {
    ordenesService.listarOrdenesActivas.and.returnValue(throwError(() => new Error('Server error')));
    const errorSpy = spyOn(notificationService, 'error');

    component.loadOrdenes();

    expect(errorSpy).toHaveBeenCalledWith('Error al cargar órdenes');
  });
});
