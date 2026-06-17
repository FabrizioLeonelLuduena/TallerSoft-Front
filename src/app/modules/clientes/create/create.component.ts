import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../../core/services/notification.service';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClienteService, ClienteRequest } from '../services/cliente.service';
import { EquipoService } from '@modules/ordenes/services/equipo.service';

@Component({
  selector: 'app-clientes-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private equipoService = inject(EquipoService);
  private router = inject(Router);
  private notifications = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  isLoading = false;
  selectedEquipmentType: string | null = null;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      telefono: [''],
      email: ['', Validators.email],
      direccion: [''],
      marca: [''],
      modelo: [''],
      numeroSerie: [''],
      observaciones: ['']
    });
  }

  ngOnInit() {
    // Form is initialized in constructor
  }

  get nombreControl() {
    return this.form.get('nombre');
  }

  get emailControl() {
    return this.form.get('email');
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    const data: ClienteRequest = {
      nombre: this.form.value.nombre,
      telefono: this.form.value.telefono || null,
      email: this.form.value.email || null,
      direccion: this.form.value.direccion || null
    };

    this.clienteService.crearCliente(data).pipe(
      finalize(() => this.isLoading = false),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        // If equipment type is selected, create equipment
        if (this.selectedEquipmentType) {
          const equipoData = {
            clienteId: response.id,
            tipo: this.selectedEquipmentType,
            marca: this.form.value.marca || null,
            modelo: this.form.value.modelo || null,
            numeroSerie: this.form.value.numeroSerie || null,
            observaciones: this.form.value.observaciones || null
          };

          this.equipoService.crearEquipo(equipoData).subscribe({
            next: () => {
              this.notifications.success('Cliente y equipo creados correctamente');
              this.router.navigate(['/clientes', response.id]);
            },
            error: err => {
              this.notifications.warning('Cliente creado pero hubo error al crear el equipo');
              this.router.navigate(['/clientes', response.id]);
            }
          });
        } else {
          this.notifications.success('Cliente creado correctamente');
          this.router.navigate(['/clientes', response.id]);
        }
      },
      error: err => {
        this.notifications.error(err.error?.message || 'Error al crear el cliente');
      }
    });
  }

  selectType(type: string): void {
    this.selectedEquipmentType = type;
  }

  onCancel() {
    this.router.navigate(['/clientes']);
  }
}

