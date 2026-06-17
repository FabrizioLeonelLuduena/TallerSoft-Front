import { Routes } from '@angular/router';
import { AuthGuard } from '@core/auth/auth.guard';
import { CobrarOrdenComponent } from './components/cobrar-orden/cobrar-orden.component';
import { CajaDiariaComponent } from './components/caja-diaria/caja-diaria.component';

export const cajaRoutes: Routes = [
  { path: 'cobrar/:ordenId', component: CobrarOrdenComponent, canActivate: [AuthGuard] },
  { path: 'diaria',          component: CajaDiariaComponent,  canActivate: [AuthGuard] }
];
