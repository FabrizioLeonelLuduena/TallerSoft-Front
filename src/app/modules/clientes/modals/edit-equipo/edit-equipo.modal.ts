import { Component, Input, Output, EventEmitter, OnInit, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EquipoService, EquipoResponse } from '@modules/ordenes/services/equipo.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-edit-equipo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Editar Equipo</h2>
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
          <div class="form-section">
            <label>Tipo de Equipo</label>
            <div class="equipment-selector">
              <div 
                class="selection-card"
                *ngFor="let type of equipmentTypes"
                [class.selected]="selectedType === type.value"
                (click)="selectType(type.value)"
              >
                <span class="material-symbols-outlined">{{ type.icon }}</span>
                <span class="type-name">{{ type.label }}</span>
              </div>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-field">
              <label for="marca">Marca</label>
              <input 
                id="marca"
                type="text"
                class="ts-input"
                formControlName="marca"
                placeholder="ej: Apple, Dell, Samsung"
                [disabled]="isLoading"
              />
            </div>
            <div class="form-field">
              <label for="modelo">Modelo</label>
              <input 
                id="modelo"
                type="text"
                class="ts-input"
                formControlName="modelo"
                placeholder="ej: ThinkPad E15, iPhone 14"
                [disabled]="isLoading"
              />
            </div>
          </div>

          <div class="form-field">
            <label for="numeroSerie">Número de Serie</label>
            <input 
              id="numeroSerie"
              type="text"
              class="ts-input"
              formControlName="numeroSerie"
              placeholder="ej: SN-9920384752"
              [disabled]="isLoading"
            />
          </div>

          <div class="form-field">
            <label for="observaciones">Observaciones</label>
            <textarea 
              id="observaciones"
              class="ts-input"
              formControlName="observaciones"
              placeholder="Notas adicionales sobre el equipo"
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
              [disabled]="form.pristine || isLoading"
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
      gap: 24px;
      flex: 1;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 12px;

      > label {
        font-size: 13px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .equipment-selector {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      @media (max-width: 500px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .selection-card {
      padding: 16px 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(0, 245, 212, 0.2);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;

      .material-symbols-outlined {
        font-size: 28px;
        color: rgba(0, 245, 212, 0.6);
      }

      .type-name {
        font-size: 12px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
      }

      &:hover {
        border-color: rgba(0, 245, 212, 0.4);
        background: rgba(0, 245, 212, 0.05);
      }

      &.selected {
        background: rgba(0, 245, 212, 0.15);
        border-color: #00f5d4;

        .material-symbols-outlined {
          color: #00f5d4;
        }

        .type-name {
          color: #00f5d4;
        }
      }
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

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
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
export class EditEquipoModal implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() equipo: EquipoResponse | null = null;
  @Output() saved = new EventEmitter<EquipoResponse>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup;
  isLoading = false;
  selectedType: string | null = null;

  equipmentTypes = [
    { value: 'Smartphone', label: 'Smartphone', icon: 'smartphone' },
    { value: 'Laptop', label: 'Laptop', icon: 'laptop_mac' },
    { value: 'Desktop', label: 'Desktop', icon: 'computer' },
    { value: 'Otro', label: 'Otro', icon: 'devices_other' }
  ];

  private equipoService = inject(EquipoService);
  private notifications = inject(NotificationService);
  private fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      marca: [''],
      modelo: [''],
      numeroSerie: [''],
      observaciones: ['']
    });
  }

  ngOnInit() {
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['equipo']) {
      this.populateForm();
    }
  }

  populateForm() {
    if (this.equipo) {
      this.selectedType = this.equipo.tipo;
      this.form.patchValue({
        marca: this.equipo.marca || '',
        modelo: this.equipo.modelo || '',
        numeroSerie: this.equipo.numeroSerie || '',
        observaciones: (this.equipo as any).observaciones || ''
      });
      this.form.markAsPristine();
    }
  }

  get marcaControl() {
    return this.form.get('marca');
  }

  get modeloControl() {
    return this.form.get('modelo');
  }

  get numeroSerieControl() {
    return this.form.get('numeroSerie');
  }

  get observacionesControl() {
    return this.form.get('observaciones');
  }

  selectType(type: string) {
    this.selectedType = type;
    this.form.markAsDirty();
  }

  onCancel() {
    this.form.reset();
    this.selectedType = null;
    this.cancelled.emit();
  }

  onSubmit() {
    if (!this.equipo || !this.selectedType) return;

    this.isLoading = true;
    const updateData = {
      clienteId: this.equipo.clienteId,
      tipo: this.selectedType,
      marca: this.form.value.marca || '',
      modelo: this.form.value.modelo || '',
      numeroSerie: this.form.value.numeroSerie || '',
      observaciones: this.form.value.observaciones || ''
    };

    this.equipoService.editarEquipo(this.equipo.id, updateData).subscribe({
      next: (updatedEquipo: EquipoResponse) => {
        this.notifications.success('Equipo actualizado correctamente');
        this.saved.emit(updatedEquipo);
        this.isLoading = false;
      },
      error: (err: any) => {
        this.notifications.error(err.error?.message || 'Error al actualizar el equipo');
        this.isLoading = false;
      }
    });
  }
}
