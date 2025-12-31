import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./core/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'storage',
    canActivate: [authGuard],
    loadChildren: () => import('./storage/storage.routes').then(m => m.routes)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
