import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService, ClienteResponse } from '../../services/cliente.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-edit-cliente-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Editar Cliente</h2>
          <button 
            class="btn-close"
            (click)="onCancel()"
            type="button"
            [disabled]="isLoading"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="edit-form">
          <div class="form-field">
            <label for="nombre">Nombre *</label>
            <input 
              id="nombre"
              type="text"
              class="ts-input"
              formControlName="nombre"
              placeholder="Nombre del cliente"
              [disabled]="isLoading"
            />
            <span class="error-text" *ngIf="nombreControl?.invalid && nombreControl?.touched">
              El nombre es requerido
            </span>
          </div>

          <div class="form-field">
            <label for="email">Email</label>
            <input 
              id="email"
              type="email"
              class="ts-input"
              formControlName="email"
              placeholder="correo@ejemplo.com"
              [disabled]="isLoading"
            />
            <span class="error-text" *ngIf="emailControl?.invalid && emailControl?.touched">
              Ingresa un email válido
            </span>
          </div>

          <div class="form-field">
            <label for="telefono">Teléfono</label>
            <input 
              id="telefono"
              type="tel"
              class="ts-input"
              formControlName="telefono"
              placeholder="+54 9 1234 567890"
              [disabled]="isLoading"
            />
          </div>

          <div class="form-field">
            <label for="direccion">Dirección</label>
            <textarea 
              id="direccion"
              class="ts-input"
              formControlName="direccion"
              placeholder="Dirección completa"
              rows="3"
              [disabled]="isLoading"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button 
              class="btn-cancel"
              (click)="onCancel()"
              type="button"
              [disabled]="isLoading"
            >
              Cancelar
            </button>
            <button 
              class="btn-save"
              type="submit"
              [disabled]="form.invalid || isLoading"
            >
              <span *ngIf="!isLoading">Guardar Cambios</span>
              <span *ngIf="isLoading">Guardando...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-content {
      background: #141824;
      border: 1px solid rgba(222, 225, 247, 0.08);
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(222, 225, 247, 0.08);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
      }
    }

    .btn-close {
      width: 32px;
      height: 32px;
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      .material-symbols-outlined {
        font-size: 20px;
      }

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.9);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .edit-form {
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      flex: 1;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 13px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .ts-input {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(0, 245, 212, 0.2);
      border-radius: 8px;
      padding: 10px 12px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
      outline: none;

      &:focus {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(0, 245, 212, 0.4);
        box-shadow: 0 0 0 3px rgba(0, 245, 212, 0.05);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }

    textarea.ts-input {
      resize: vertical;
      min-height: 80px;
    }

    .error-text {
      font-size: 12px;
      color: #ef4444;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 20px;
      border-top: 1px solid rgba(222, 225, 247, 0.08);
      flex-shrink: 0;
    }

    button {
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.9);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .btn-save {
      background: #00f5d4;
      color: #0a0f1e;
      border-color: #00f5d4;

      &:hover:not(:disabled) {
        background: #00e0ba;
        border-color: #00e0ba;
      }

      &:active:not(:disabled) {
        transform: scale(0.98);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class EditClienteModal implements OnInit {
  @Input() isOpen = false;
  @Input() cliente: ClienteResponse | null = null;
  @Output() saved = new EventEmitter<ClienteResponse>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup;
  isLoading = false;

  private clienteService = inject(ClienteService);
  private notifications = inject(NotificationService);
  private fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      telefono: [''],
      email: ['', Validators.email],
      direccion: ['']
    });
  }

  ngOnInit() {
    this.populateForm();
  }

  ngOnChanges() {
    this.populateForm();
  }

  populateForm() {
    if (this.cliente) {
      this.form.patchValue({
        nombre: this.cliente.nombre,
        telefono: this.cliente.telefono,
        email: this.cliente.email,
        direccion: this.cliente.direccion
      });
    }
  }

  get nombreControl() {
    return this.form.get('nombre');
  }

  get emailControl() {
    return this.form.get('email');
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }

  onSubmit() {
    if (this.form.invalid || !this.cliente) return;

    this.isLoading = true;
    this.clienteService.editarCliente(this.cliente.id, this.form.value).subscribe({
      next: (updatedCliente) => {
        this.notifications.success('Cliente actualizado correctamente');
        this.saved.emit(updatedCliente);
        this.isLoading = false;
      },
      error: (err) => {
        this.notifications.error(err.error?.message || 'Error al actualizar el cliente');
        this.isLoading = false;
      }
    });
  }
}
