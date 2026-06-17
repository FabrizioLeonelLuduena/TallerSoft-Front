import { Routes } from '@angular/router';
import { OrdenesPrincipalComponent } from './ordenes.component';
import { DetailComponent } from './detail/detail.component';
import { CreateComponent } from './create/create.component';

export const ORDENES_ROUTES: Routes = [
  { path: '', component: OrdenesPrincipalComponent },
  { path: 'nueva', component: CreateComponent },
  { path: ':id', component: DetailComponent }
];
