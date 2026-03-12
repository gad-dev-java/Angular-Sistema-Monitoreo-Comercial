import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth';
import { roleGuard } from './core/guards/role';

const ADMIN = ['ROLE_ADMIN'];
const ADMIN_GERENTE = ['ROLE_ADMIN', 'ROLE_GERENTE'];
const ALL_ROLES = ['ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_SUPERVISOR'];

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./core/components/login/login').then((m) => m.LoginComponent),
  },
  {
    // Shell layout — todas las rutas autenticadas viven aquí
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/components/shell/shell').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./core/components/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'companies',
        canActivate: [roleGuard(ADMIN)],
        loadComponent: () =>
          import('./core/components/company/company').then((m) => m.CompanyComponent),
      },
      {
        path: 'stores',
        canActivate: [roleGuard(ALL_ROLES)],
        loadComponent: () => import('./core/components/store/store').then((m) => m.StoreComponent),
      },
      {
        path: 'objectives',
        canActivate: [roleGuard(ADMIN_GERENTE)],
        loadComponent: () =>
          import('./core/components/objective/objective').then((m) => m.ObjectiveComponent),
      },
      {
        path: 'sales',
        canActivate: [roleGuard(ALL_ROLES)], // ← GERENTE + SUPERVISOR
        loadComponent: () => import('./core/components/sale/sale').then((m) => m.SaleComponent),
      },
      {
        path: 'alerts',
        canActivate: [roleGuard(ALL_ROLES)],
        loadComponent: () => import('./core/components/alert/alert').then((m) => m.AlertComponent),
      },
      {
        path: 'kpi',
        canActivate: [roleGuard(ALL_ROLES)],
        loadComponent: () => import('./core/components/kpi/kpi').then((m) => m.KpiComponent),
      },
      {
        path: 'reports',
        canActivate: [roleGuard(ADMIN_GERENTE)],
        loadComponent: () =>
          import('./core/components/report/report').then((m) => m.ReportComponent),
      },
      {
        path: 'users',
        canActivate: [roleGuard(ADMIN_GERENTE)],
        loadComponent: () => import('./core/components/User/User').then((m) => m.UserComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
