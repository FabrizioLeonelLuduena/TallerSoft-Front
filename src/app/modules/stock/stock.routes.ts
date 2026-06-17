import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';
import { RoleGuard } from '../../core/auth/role.guard';
import { StockListComponent } from './list/list.component';
import { StockCreateComponent } from './create/create.component';
import { Rol } from '@core/models/rol.enum';

export const stockRoutes: Routes = [
  {
    path: '',
    component: StockListComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Rol.ADMIN, Rol.TECNICO] }
  },
  {
    path: 'nuevo',
    component: StockCreateComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Rol.ADMIN] }
  }
];
