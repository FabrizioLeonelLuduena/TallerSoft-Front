import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { CreateComponent } from './create/create.component';
import { DetailComponent } from './detail/detail.component';

console.log('[clientes.routes] Module loaded');

export const clientesRoutes: Routes = [
  {
    path: '',
    component: ListComponent,
  },
  {
    path: 'nuevo',
    component: CreateComponent,
  },
  {
    path: ':id',
    component: DetailComponent,
  },
];
