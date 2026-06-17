import { Component, OnInit, Inject, inject, DestroyRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RepuestosService, RepuestoResponse } from '../../services/repuestos.service';
import { OrdenesService } from '../../services/ordenes.service';

@Component({
  selector: 'app-add-repuesto-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, DecimalPipe],
  templateUrl: './add-repuesto-dialog.component.html',
  styleUrls: ['./add-repuesto-dialog.component.scss']
})
export class AddRepuestoDialogComponent implements OnInit {
  private repuestosService = inject(RepuestosService);
  private ordenesService = inject(OrdenesService);
  private dialogRef = inject(MatDialogRef);
  private destroyRef = inject(DestroyRef);

  repuestosCache: RepuestoResponse[] = [];
  filteredRepuestos: RepuestoResponse[] = [];
  selectedRepuesto: RepuestoResponse | null = null;
  cantidad = 1;
  isLoading = false;
  stockError = '';
  searchTerm = '';
  private searchSubject = new Subject<string>();

  constructor(@Inject(MAT_DIALOG_DATA) public data: { ordenId: number }) {}

  ngOnInit() {
    this.isLoading = true;
    this.repuestosService.listarRepuestos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (repuestos) => {
          this.repuestosCache = repuestos;
          this.filteredRepuestos = repuestos;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((term) => {
      if (!term) {
        this.filteredRepuestos = this.repuestosCache;
      } else {
        this.filteredRepuestos = this.repuestosCache.filter(r =>
          r.nombre.toLowerCase().includes(term.toLowerCase())
        );
      }
    });
  }

  get totalPrecio(): number {
    return this.selectedRepuesto ? this.selectedRepuesto.precio * this.cantidad : 0;
  }

  onSearch(event: Event | string) {
    const value = typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    if (this.selectedRepuesto) {
      this.selectedRepuesto = null;
      this.stockError = '';
    }
    this.searchSubject.next(value);
  }

  onSelectRepuesto(repuesto: RepuestoResponse) {
    this.selectedRepuesto = repuesto;
    this.cantidad = 1;
    this.stockError = '';
    this.searchTerm = repuesto.nombre;
    this.filteredRepuestos = [];
  }

  decrementar() {
    if (this.cantidad > 1) {
      this.cantidad--;
      this.validarStock();
    }
  }

  incrementar() {
    if (this.selectedRepuesto && this.cantidad < this.selectedRepuesto.stockActual) {
      this.cantidad++;
      this.validarStock();
    }
  }

  onCantidadChange() {
    this.validarStock();
  }

  private validarStock() {
    if (!this.selectedRepuesto) return;
    if (this.cantidad > this.selectedRepuesto.stockActual) {
      this.stockError = `Stock insuficiente — disponibles: ${this.selectedRepuesto.stockActual} unidades`;
    } else if (this.cantidad < 1) {
      this.cantidad = 1;
      this.stockError = '';
    } else {
      this.stockError = '';
    }
  }

  onSubmit() {
    if (!this.selectedRepuesto || this.cantidad < 1) {
      this.stockError = 'Por favor selecciona un repuesto y especifica la cantidad';
      return;
    }

    if (this.cantidad > this.selectedRepuesto.stockActual) {
      this.stockError = `Stock insuficiente — disponibles: ${this.selectedRepuesto.stockActual} unidades`;
      return;
    }

    this.isLoading = true;
    const request = {
      repuestoId: this.selectedRepuesto.id,
      cantidad: this.cantidad
    };

    this.ordenesService.agregarRepuesto(this.data.ordenId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orden) => {
          this.dialogRef.close(orden);
        },
        error: (err) => {
          this.isLoading = false;
          this.stockError = err.error?.message || 'Error al agregar repuesto';
        }
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
