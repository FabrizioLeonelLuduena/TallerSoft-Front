import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsuarioService, UsuarioResponse } from '../../services/usuario.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() usuario: UsuarioResponse | null = null;
  @Output() closed = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private notifications = inject(NotificationService);

  form!: FormGroup;
  loading = false;
  showPassword = false;
  selectedRole = '';

  private destroy$ = new Subject<void>();

  ngOnChanges(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.selectedRole = this.usuario?.rol ?? '';
    this.form = this.fb.group({
      nombre: [this.usuario?.nombre ?? '', [Validators.required]],
      email:  [this.usuario?.email  ?? '', [Validators.required, Validators.email]],
      password: [''],
      rol:    [this.usuario?.rol    ?? '', [Validators.required]]
    });
  }

  selectRole(rol: string): void {
    this.selectedRole = rol;
    this.form.get('rol')?.setValue(rol);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
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

    const password = this.form.get('password')?.value as string;
    if (password && password.length > 0 && password.length < 8) {
      this.form.get('password')?.setErrors({ minlength: true });
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload: any = {
      nombre: this.form.get('nombre')?.value,
      email:  this.form.get('email')?.value,
      rol:    this.form.get('rol')?.value
    };
    if (password) payload.password = password;

    this.usuarioService.editarUsuario(this.usuario!.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Usuario actualizado correctamente');
          this.loading = false;
          this.closed.emit(true);
        },
        error: err => {
          const message = err.error?.message || 'Error al actualizar el usuario';
          if (message.toLowerCase().includes('email') || message.toLowerCase().includes('exist')) {
            this.form.get('email')?.setErrors({ duplicate: true });
            this.form.markAllAsTouched();
          } else {
            this.notifications.error(message);
          }
          this.loading = false;
        }
      });
  }

  getEmailError(): string {
    const c = this.form.get('email');
    if (c?.hasError('required')) return 'El email es requerido';
    if (c?.hasError('email')) return 'Ingresá un email válido';
    if (c?.hasError('duplicate')) return 'Este email ya está registrado';
    return '';
  }
}
