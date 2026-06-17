import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsuarioService, UsuarioResponse, UsuarioRequest } from '../../services/usuario.service';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss']
})
export class CreateUserDialogComponent {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private notifications = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<CreateUserDialogComponent>);
  private destroyRef = inject(DestroyRef);

  isLoading = false;
  showPassword = false;
  selectedRole: string = 'TECNICO';

  form = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rol: ['', [Validators.required]]
  });

  get nombreControl() {
    return this.form.get('nombre');
  }

  get emailControl() {
    return this.form.get('email');
  }

  get passwordControl() {
    return this.form.get('password');
  }

  get rolControl() {
    return this.form.get('rol');
  }

  selectRole(rol: string) {
    this.selectedRole = rol;
    this.form.get('rol')?.setValue(rol);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData: UsuarioRequest = {
      nombre: this.form.get('nombre')?.value as string,
      email: this.form.get('email')?.value as string,
      password: this.form.get('password')?.value as string,
      rol: this.form.get('rol')?.value as string
    };

    this.usuarioService.crearUsuario(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: UsuarioResponse) => {
          this.isLoading = false;
          this.dialogRef.close(response);
        },
        error: (err) => {
          this.isLoading = false;
          const message = err.error?.message || 'Error al crear el usuario';

          if (message.toLowerCase().includes('email') || message.toLowerCase().includes('exist')) {
            this.form.get('email')?.setErrors({ duplicate: true });
          } else {
            this.notifications.error(message);
          }
        }
      });
  }

  getEmailError(): string {
    const control = this.emailControl;
    if (control?.hasError('required')) return 'El email es requerido';
    if (control?.hasError('email')) return 'Ingresá un email válido';
    if (control?.hasError('duplicate')) return 'Este email ya está registrado';
    return '';
  }

  getPasswordHint(): string {
    const control = this.passwordControl;
    if (!control?.touched) return 'Mínimo 8 caracteres';
    if (control?.hasError('minlength')) return 'Mínimo 8 caracteres';
    return '';
  }
}
