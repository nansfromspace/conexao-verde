import { Routes } from '@angular/router';
import { TelaDeRegistroComponent } from './tela-de-registro/tela-de-registro.component';
import { TelaInicialComponent } from './tela-inicial/tela-inicial.component';
import { TelaDoMapaComponent } from './tela-do-mapa/tela-do-mapa.component';
import { TelaDeLoginComponent } from './tela-de-login/tela-de-login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'splash', pathMatch: 'full' },
  {
    path: 'splash',
    loadComponent: () =>
      import('./splash/splash.component').then(
        (m) => m.SplashComponent
      ),
  },
  {
    path: 'introducao',
    loadComponent: () =>
      import('./tela-de-introducao/tela-de-introducao.component').then(
        (m) => m.TelaDeIntroducaoComponent
      ),
  },
  { path: 'registro', component: TelaDeRegistroComponent },
  { path: 'home', component: TelaInicialComponent },
  { path: 'mapa', component: TelaDoMapaComponent },
  { path: 'login', component: TelaDeLoginComponent },
];