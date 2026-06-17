import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <dialog #d class="confirm-dialog" (click)="onCancel()" (cancel)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>¿Desactivar cliente?</h2>
        </div>

        <div class="modal-body">
          <p class="warning-text">
            Se desactivará a "{{ clienteName }}". El cliente quedará inactivo pero sus órdenes e historial se conservarán.
          </p>
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
            <span *ngIf="!isLoading">Desactivar Cliente</span>
            <span *ngIf="isLoading">Desactivando...</span>
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
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 32px;
      animation: slideUp 0.3s ease-out;
    }

    .modal-header {
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #ef4444;
      }
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .warning-text {
      margin: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
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
        opacity: 0.6;
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

    .btn-delete {
      background: #ef4444;
      color: white;
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
export class DeleteConfirmModal implements OnChanges {
  @ViewChild('d') private dialogRef!: ElementRef<HTMLDialogElement>;

  @Input() isOpen = false;
  @Input() clienteName = '';
  @Input() clienteId: number | null = null;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isLoading = false;

  private clienteService = inject(ClienteService);
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
    if (!this.clienteId) return;

    this.isLoading = true;
    this.clienteService.eliminarCliente(this.clienteId).subscribe({
      next: () => {
        this.notifications.success('Cliente eliminado correctamente');
        this.confirmed.emit();
      },
      error: (err) => {
        this.notifications.error(err.error?.message || 'Error al eliminar el cliente');
        this.isLoading = false;
      }
    });
  }
}
