import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdenesService } from '../services/ordenes.service';
import { ClienteService } from '../../clientes/services/cliente.service';
import { EquipoService, EquipoResponse } from '../services/equipo.service';
import { UsuariosService, Usuario } from '../../../core/services/usuarios.service';
import { AuthService } from '../../../core/auth/auth.service';

interface ClienteResponse {
  id: number;
  nombre: string;
  email?: string | null;
}

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notifications = inject(NotificationService);
  private ordenesService = inject(OrdenesService);
  private clienteService = inject(ClienteService);
  private equipoService = inject(EquipoService);
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  form!: FormGroup;

  // Cliente
  clientes: ClienteResponse[] = [];
  selectedCliente: ClienteResponse | null = null;
  showClienteDropdown = false;
  clienteSearchTerm = '';
  private searchSubject = new Subject<string>();

  // Equipo
  equipos: EquipoResponse[] = [];
  filteredEquipos: EquipoResponse[] = [];
  selectedEquipo: EquipoResponse | null = null;
  showEquipoDropdown = false;
  equipoSearchTerm = '';
  isLoadingEquipos = false;

  // Técnico
  tecnicos: Usuario[] = [];
  filteredTecnicos: Usuario[] = [];
  selectedTecnico: Usuario | null = null;
  showTecnicoDropdown = false;
  tecnicoSearchTerm = '';
  isTecnico = false;

  isLoading = false;
  isSubmitting = false;

  get equipoIdControl() {
    return this.form.get('equipoId');
  }

  get fallaReportadaControl() {
    return this.form.get('fallaReportada');
  }

  ngOnInit() {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      equipoId: [null, Validators.required],
      tecnicoId: [null],
      prioridad: ['NORMAL', Validators.required],
      presupuesto: [null],
      fallaReportada: ['', Validators.required]
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.clienteService.listarClientes(q)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (results) => {
        this.clientes = results;
        this.showClienteDropdown = results.length > 0;
      },
      error: () => {
        this.notifications.error('Error al buscar clientes');
      }
    });

    const currentUser = this.authService.getCurrentUser();
    this.isTecnico = currentUser?.rol === 'TECNICO';

    if (this.isTecnico && currentUser) {
      this.usuariosService.obtenerUsuario(currentUser.userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (usuario) => {
            this.selectedTecnico = usuario;
            this.tecnicoSearchTerm = usuario.nombre;
            this.form.patchValue({ tecnicoId: usuario.id });
          },
          error: () => {
            this.notifications.error('Error al cargar datos del técnico');
          }
        });
    } else {
      this.usuariosService.obtenerUsuariosPorRol('TECNICO')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (usuarios) => {
            this.tecnicos = usuarios.filter(u => u.activo);
            this.filteredTecnicos = this.tecnicos;
          },
          error: () => {
            this.notifications.error('Error al cargar técnicos');
          }
        });
    }
  }

  // ── Blur (cierra dropdown al salir del campo) ────────────

  onClienteBlur()  { setTimeout(() => { this.showClienteDropdown  = false; }, 200); }
  onEquipoBlur()   { setTimeout(() => { this.showEquipoDropdown   = false; }, 200); }
  onTecnicoBlur()  { setTimeout(() => { this.showTecnicoDropdown  = false; }, 200); }

  // ── Cliente ──────────────────────────────────────────────

  onClienteFocus() {
    this.showEquipoDropdown = false;
    this.showTecnicoDropdown = false;
    if (this.clientes.length > 0) {
      this.showClienteDropdown = true;
      return;
    }
    this.searchSubject.next(this.clienteSearchTerm);
  }

  onClienteSearch(event: Event | string) {
    const value = typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    this.clienteSearchTerm = value;
    this.showClienteDropdown = true;
    this.searchSubject.next(value);
  }

  onClienteSelect(cliente: ClienteResponse) {
    this.selectedCliente = cliente;
    this.selectedEquipo = null;
    this.equipoSearchTerm = '';
    this.filteredEquipos = [];
    this.form.patchValue({ clienteId: cliente.id, equipoId: null });
    this.showClienteDropdown = false;
    this.clienteSearchTerm = cliente.nombre;
    this.equipos = [];
    this.isLoadingEquipos = true;
    this.equipoService.listarEquiposDelCliente(cliente.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (equipos) => {
          this.equipos = equipos;
          this.filteredEquipos = equipos;
          this.isLoadingEquipos = false;
        },
        error: () => {
          this.isLoadingEquipos = false;
          this.notifications.error('Error al cargar equipos del cliente');
        }
      });
  }

  // ── Equipo ───────────────────────────────────────────────

  onEquipoFocus() {
    if (!this.selectedCliente || this.isLoadingEquipos) return;
    this.filteredEquipos = this.equipos;
    this.showEquipoDropdown = this.equipos.length > 0;
    this.showClienteDropdown = false;
    this.showTecnicoDropdown = false;
  }

  onEquipoSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.equipoSearchTerm = value;
    const q = value.toLowerCase().trim();
    if (q === '') {
      this.filteredEquipos = this.equipos;
    } else {
      this.filteredEquipos = this.equipos.filter(eq =>
        eq.tipo.toLowerCase().includes(q) ||
        (eq.marca?.toLowerCase().includes(q) ?? false) ||
        (eq.modelo?.toLowerCase().includes(q) ?? false)
      );
    }
    this.showEquipoDropdown = this.filteredEquipos.length > 0;
  }

  onEquipoSelect(equipo: EquipoResponse) {
    this.selectedEquipo = equipo;
    this.form.patchValue({ equipoId: equipo.id });
    this.equipoSearchTerm = [equipo.tipo, equipo.marca, equipo.modelo].filter(Boolean).join(' • ');
    this.showEquipoDropdown = false;
  }

  // ── Técnico ──────────────────────────────────────────────

  onTecnicoFocus() {
    this.filteredTecnicos = this.tecnicos;
    this.showTecnicoDropdown = true;
    this.showClienteDropdown = false;
    this.showEquipoDropdown = false;
  }

  onTecnicoSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.tecnicoSearchTerm = value;
    const q = value.toLowerCase().trim();
    this.filteredTecnicos = q === ''
      ? this.tecnicos
      : this.tecnicos.filter(tec => tec.nombre.toLowerCase().includes(q));
    this.showTecnicoDropdown = true;
  }

  onTecnicoSelect(tecnico: Usuario | null) {
    this.selectedTecnico = tecnico;
    this.form.patchValue({ tecnicoId: tecnico ? tecnico.id : null });
    this.tecnicoSearchTerm = tecnico ? tecnico.nombre : '';
    this.showTecnicoDropdown = false;
  }

  // ── Formulario ───────────────────────────────────────────

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.warning('Completá todos los campos requeridos');
      return;
    }

    this.isSubmitting = true;
    const formData = { ...this.form.value };

    this.ordenesService.crearOrden(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orden) => {
          this.notifications.success('Orden creada exitosamente');
          this.router.navigate(['/ordenes', orden.id]);
        },
        error: (err) => {
          this.isSubmitting = false;
          const message = err.error?.message || 'Error al crear la orden';
          this.notifications.error(message);
        }
      });
  }

  navigateBack() {
    this.router.navigate(['/ordenes']);
  }

  selectPrioridad(prioridad: 'BAJA' | 'NORMAL' | 'ALTA') {
    this.form.patchValue({ prioridad });
  }
}
