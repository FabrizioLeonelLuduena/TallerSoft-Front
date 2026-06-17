import { Component } from '@angular/core';
import { ListComponent } from './list/list.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ListComponent],
  template: `
    <app-usuarios-list></app-usuarios-list>
  `
})
export class UsuariosComponent {}
