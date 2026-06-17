import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RepuestosService, Repuesto } from '../../../ordenes/services/repuestos.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-repuesto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './repuesto-dialog.component.html',
  styleUrls: ['./repuesto-dialog.component.scss']
})
export class RepuestoDialogComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() repuesto: Repuesto | null = null;
  @Output() closed = new EventEmitter<boolean>();

  form!: FormGroup;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private repuestosService: RepuestosService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre:      [this.repuesto?.nombre      || '', [Validators.required, Validators.minLength(3)]],
      categoria:   [this.repuesto?.categoria   || ''],
      precio:      [this.repuesto?.precio      || '', [Validators.required, Validators.min(0.01)]],
      stockActual: [this.repuesto?.stockActual ?? 0,  [Validators.required, Validators.min(0)]],
      stockMinimo: [this.repuesto?.stockMinimo ?? 5,  [Validators.required, Validators.min(0)]],
      stockBajo:   [this.repuesto?.stockBajo   ?? 10, [Validators.required, Validators.min(0)]]
    });
  }

  onCancel(): void {
    this.form.reset();
    this.closed.emit(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.repuestosService.editarRepuesto(this.repuesto!.id, this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Repuesto actualizado correctamente');
          this.loading = false;
          this.closed.emit(true);
        },
        error: err => {
          this.notifications.error(err.error?.message || 'Error al actualizar el repuesto');
          this.loading = false;
        }
      });
  }
}
