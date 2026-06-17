import { Routes } from '@angular/router';
import { AuthGuard } from '@core/auth/auth.guard';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { InventarioComponent } from './modules/inventario/inventario.component';
import { ReportesComponent } from './modules/reportes/reportes.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { PerfilComponent } from './modules/perfil/perfil.component';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'clientes',
        loadChildren: () => import('./modules/clientes/clientes.routes').then(m => m.clientesRoutes),
        canActivate: [AuthGuard]
      },
      {
        path: 'ordenes',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/ordenes/ordenes.routes').then(m => m.ORDENES_ROUTES)
      },
      {
        path: 'stock',
        loadChildren: () => import('./modules/stock/stock.routes').then(m => m.stockRoutes),
        canActivate: [AuthGuard]
      },
      {
        path: 'caja',
        loadChildren: () => import('./modules/caja/caja.routes').then(m => m.cajaRoutes),
        canActivate: [AuthGuard]
      },
      {
        path: 'inventario',
        component: InventarioComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'reportes',
        component: ReportesComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./modules/usuarios/usuarios.routes').then(m => m.USUARIOS_ROUTES),
        canActivate: [AuthGuard]
      },
      {
        path: 'asistente',
        loadChildren: () => import('./modules/asistente/asistente.routes').then(m => m.asistenteRoutes),
        canActivate: [AuthGuard]
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'unauthorized',
        component: UnauthorizedComponent
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
