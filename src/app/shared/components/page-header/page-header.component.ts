import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() createLabel: string = 'Crear';
  @Input() hasFilters: boolean = true;
  @Output() createClick = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();

  onCreateClick(): void {
    this.createClick.emit();
  }

  onFilterClick(): void {
    this.filterClick.emit();
  }
}
