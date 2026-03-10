import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./core/components/login/login').then(m => m.LoginComponent),
  },
  {
    // Shell layout — todas las rutas autenticadas viven aquí
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/components/shell/shell').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./core/components/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./core/components/company/company').then(m => m.CompanyComponent),
      },
      {
        path: 'stores',
        loadComponent: () =>
          import('./core/components/store/store').then(m => m.StoreComponent),
      },
      {
        path: 'objectives',
        loadComponent: () =>
          import('./core/components/objective/objective').then(m => m.ObjectiveComponent),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./core/components/sale/sale').then(m => m.SaleComponent),
      },
      // Próximas rutas se agregan aquí:
      // { path: 'stores',     loadComponent: ... },
      // { path: 'objectives', loadComponent: ... },
      // { path: 'sales',      loadComponent: ... },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
