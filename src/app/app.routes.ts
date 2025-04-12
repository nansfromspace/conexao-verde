import { Routes } from '@angular/router';
import { TelaDeRegistroComponent } from './tela-de-registro/tela-de-registro.component';
import { TelaInicialComponent } from './tela-inicial/tela-inicial.component';

export const routes: Routes = [
  { path: '', redirectTo: 'registro', pathMatch: 'full' },
  { path: 'registro', component: TelaDeRegistroComponent },
  { path: 'home', component: TelaInicialComponent }
];
