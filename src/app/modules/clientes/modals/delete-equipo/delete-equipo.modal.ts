import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipoService } from '@modules/ordenes/services/equipo.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-delete-equipo-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <dialog #d class="confirm-dialog" (click)="onCancel()" (cancel)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span class="material-symbols-outlined modal-icon">delete_forever</span>
          <h2>¿Eliminar equipo?</h2>
        </div>

        <div class="modal-body">
          <p class="confirmation-text">
            Esta acción no se puede deshacer. Se eliminará el equipo del cliente.
          </p>
          <div class="equipo-info" *ngIf="equipo">
            <p class="info-line">
              <strong>Tipo:</strong> {{ equipo.tipo }}
            </p>
            <p class="info-line" *ngIf="equipo.marca || equipo.modelo">
              <strong>Marca/Modelo:</strong> {{ equipo.marca }} {{ equipo.modelo }}
            </p>
          </div>
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
            class="btn-delete"
            (click)="onConfirm()"
            type="button"
            [disabled]="isLoading"
          >
            <span *ngIf="!isLoading">Eliminar</span>
            <span *ngIf="isLoading">Eliminando...</span>
          </button>
        </div>
      </div>
    </dialog>
  `,
  styles: [`
    .confirm-dialog {
      all: unset;
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      display: none;
      align-items: center;
      justify-content: center;

      &[open] {
        display: flex;
        background: rgba(0, 0, 0, 0.6);
        animation: fadeIn 0.2s ease-out;
      }
    }

    .modal-content {
      background: #141824;
      border: 1px solid rgba(222, 225, 247, 0.08);
      border-radius: 16px;
      width: 90%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(222, 225, 247, 0.08);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
      }
    }

    .modal-icon {
      font-size: 24px;
      color: #ef4444;
      flex-shrink: 0;
    }

    .modal-body {
      padding: 24px 32px;
      flex: 1;
    }

    .confirmation-text {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
    }

    .equipo-info {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(222, 225, 247, 0.08);
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 16px;
    }

    .info-line {
      margin: 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.4;

      &:not(:last-child) {
        margin-bottom: 8px;
      }

      strong {
        color: rgba(255, 255, 255, 0.9);
        font-weight: 600;
      }
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 20px 32px;
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
      border-color: rgba(255, 255, 255, 0.15);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.25);
      }

      &:active:not(:disabled) {
        transform: scale(0.98);
      }
    }

    .btn-delete {
      background: #ef4444;
      color: #ffffff;
      border-color: #ef4444;

      &:hover:not(:disabled) {
        background: #dc2626;
        border-color: #dc2626;
      }

      &:active:not(:disabled) {
        transform: scale(0.98);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class DeleteEquipoModal implements OnChanges {
  @ViewChild('d') private dialogRef!: ElementRef<HTMLDialogElement>;

  @Input() isOpen = false;
  @Input() equipo: any = null;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isLoading = false;

  private equipoService = inject(EquipoService);
  private notifications = inject(NotificationService);

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['isOpen'] || !this.dialogRef) return;
    if (changes['isOpen'].currentValue) {
      this.isLoading = false;
      this.dialogRef.nativeElement.showModal();
    } else if (this.dialogRef.nativeElement.open) {
      this.dialogRef.nativeElement.close();
    }
  }

  onCancel() {
    this.cancelled.emit();
  }

  onConfirm() {
    if (!this.equipo) return;

    this.isLoading = true;
    this.equipoService.eliminarEquipo(this.equipo.id).subscribe({
      next: () => {
        this.notifications.success('Equipo eliminado correctamente');
        this.confirmed.emit();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.notifications.error(err.error?.message || 'Error al eliminar el equipo');
        this.isLoading = false;
      }
    });
  }
}
