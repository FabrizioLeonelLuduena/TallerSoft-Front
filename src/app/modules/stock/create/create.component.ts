import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RepuestosService, RepuestoRequest } from '@modules/ordenes/services/repuestos.service';

@Component({
  selector: 'app-stock-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class StockCreateComponent {
  private fb = inject(FormBuilder);
  private repuestosService = inject(RepuestosService);
  private router = inject(Router);
  private notifications = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  isLoading = false;

  form: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    categoria: [''],
    precio: ['', [Validators.required, Validators.min(0.01)]],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [5, [Validators.required, Validators.min(0)]],
    stockBajo: [10, [Validators.required, Validators.min(0)]]
  });

  get nombreControl() { return this.form.get('nombre'); }
  get precioControl() { return this.form.get('precio'); }
  get stockActualControl() { return this.form.get('stockActual'); }
  get stockMinimoControl() { return this.form.get('stockMinimo'); }
  get stockBajoControl() { return this.form.get('stockBajo'); }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    const data: RepuestoRequest = {
      nombre: this.form.value.nombre,
      categoria: this.form.value.categoria || null,
      precio: Number(this.form.value.precio),
      stockActual: Number(this.form.value.stockActual),
      stockMinimo: Number(this.form.value.stockMinimo),
      stockBajo: Number(this.form.value.stockBajo)
    };

    this.repuestosService.crearRepuesto(data).pipe(
      finalize(() => this.isLoading = false),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notifications.success('Repuesto creado correctamente');
        this.router.navigate(['/stock']);
      },
      error: err => {
        this.notifications.error(err.error?.message || 'Error al crear el repuesto');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/stock']);
  }
}
