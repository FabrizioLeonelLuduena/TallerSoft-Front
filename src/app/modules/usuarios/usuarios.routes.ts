import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { CreateComponent } from './create/create.component';

export const USUARIOS_ROUTES: Routes = [
  { path: '', component: ListComponent },
  { path: 'nuevo', component: CreateComponent }
];
