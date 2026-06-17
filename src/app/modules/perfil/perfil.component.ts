import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '@core/auth/auth.service';
import { ProfileService } from '@core/services/profile.service';
import { UsuarioService, UsuarioResponse } from '../usuarios/services/usuario.service';

const GRADIENTS = [
  'linear-gradient(135deg, #00f5d4, #0ea5e9)',
  'linear-gradient(135deg, #f97316, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #22c55e)',
  'linear-gradient(135deg, #ec4899, #f97316)',
];

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  usuario: UsuarioResponse | null = null;
  loading = true;
  saving = false;

  formNombre = '';
  formEmail = '';
  formTelefono = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  pwStrength = 0;
  pwLabel = 'Ingresá una nueva contraseña';
  pwLabelColor = '';

  showCurrentPw = false;
  showNewPw = false;
  showConfirmPw = false;

  gradients = GRADIENTS;
  selectedGradient = 0;
  avatarImage: string | null = null;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private usuarioService: UsuarioService,
    private notifications: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/login']); return; }

    const snap = this.profileService.snapshot;
    this.selectedGradient = snap.avatarGradient;
    this.avatarImage = snap.avatarImage;

    this.usuarioService.obtenerUsuario(user.userId).subscribe({
      next: (u) => {
        this.usuario = u;
        this.formNombre = u.nombre;
        this.formEmail = u.email;
        this.formTelefono = u.telefono ?? '';
        this.avatarImage = u.avatarImage ?? null;
        this.profileService.update({ nombre: u.nombre, avatarImage: u.avatarImage ?? null });
        this.loading = false;
      },
      error: () => {
        this.formEmail = user.email;
        this.formNombre = user.email.split('@')[0];
        this.loading = false;
      }
    });
  }

  get initials(): string {
    const name = this.formNombre || this.formEmail.split('@')[0] || '';
    return name.split(' ').map((w: string) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'U';
  }

  get avatarStyle(): string { return this.gradients[this.selectedGradient]; }

  get pwStrengthLevel(): string {
    if (this.pwStrength <= 1) return 'weak';
    if (this.pwStrength <= 3) return 'medium';
    return 'strong';
  }

  getRolLabel(rol: string): string {
    const map: Record<string, string> = { ADMIN: 'Administrador', TECNICO: 'Técnico', RECEPCION: 'Recepción' };
    return map[rol] ?? rol;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notifications.warning('Solo se admiten imágenes (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.notifications.warning('El archivo es demasiado grande (máx. 5 MB)');
      return;
    }

    this.profileService.compressImage(file).then((base64) => {
      this.avatarImage = base64;
      this.profileService.update({ avatarImage: base64 });
      this.usuarioService.saveAvatar(this.usuario!.id, base64).subscribe({
        error: () => this.notifications.error('No se pudo guardar la foto en el servidor')
      });
      this.notifications.success('Foto de perfil actualizada');
    }).catch(() => {
      this.notifications.error('No se pudo procesar la imagen');
    });

    input.value = '';
  }

  removePhoto(): void {
    this.avatarImage = null;
    this.profileService.update({ avatarImage: null });
    if (this.usuario) {
      this.usuarioService.saveAvatar(this.usuario.id, null).subscribe({
        error: () => this.notifications.error('No se pudo eliminar la foto en el servidor')
      });
    }
  }

  checkPasswordStrength(val: string): void {
    this.newPassword = val;
    if (!val) { this.pwStrength = 0; this.pwLabel = 'Ingresá una nueva contraseña'; this.pwLabelColor = ''; return; }
    let score = 0;
    if (val.length >= 8)  score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    this.pwStrength = score;
    const labels = ['Débil', 'Débil', 'Regular', 'Buena', 'Muy segura'];
    const colors = ['var(--color-danger)', 'var(--color-danger)', '#f59e0b', '#f59e0b', 'var(--color-success)'];
    this.pwLabel = labels[score];
    this.pwLabelColor = colors[score];
  }

  barFilled(i: number): boolean { return i < this.pwStrength; }

  saveDatos(): void {
    if (!this.usuario) return;
    this.saving = true;
    this.usuarioService.editarUsuario(this.usuario.id, {
      nombre: this.formNombre,
      email: this.formEmail,
      telefono: this.formTelefono || undefined,
      rol: this.usuario.rol
    }).subscribe({
      next: (u) => {
        this.usuario = u;
        this.profileService.update({ nombre: this.formNombre });
        this.saving = false;
        this.notifications.success('Datos actualizados');
      },
      error: () => { this.saving = false; this.notifications.error('Error al guardar los datos'); }
    });
  }

  changePassword(): void {
    if (!this.usuario) return;
    if (!this.newPassword) { this.notifications.warning('Ingresá una nueva contraseña'); return; }
    if (this.newPassword !== this.confirmPassword) { this.notifications.warning('Las contraseñas no coinciden'); return; }
    if (this.pwStrength < 2) { this.notifications.warning('La contraseña es demasiado débil'); return; }
    this.saving = true;
    this.usuarioService.editarUsuario(this.usuario.id, {
      nombre: this.usuario.nombre,
      email: this.usuario.email,
      rol: this.usuario.rol,
      password: this.newPassword,
      currentPassword: this.currentPassword || undefined
    }).subscribe({
      next: () => {
        this.saving = false;
        this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = '';
        this.pwStrength = 0; this.pwLabelColor = '';
        this.pwLabel = 'Ingresá una nueva contraseña';
        this.notifications.success('Contraseña actualizada');
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.error || 'Error al cambiar la contraseña';
        this.notifications.error(msg);
      }
    });
  }
}
