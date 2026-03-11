import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../services/Auth';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  section: string;
  badge?: number;
  roles?: string[]; // roles que pueden acceder — vacío = todos
}

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'shell.css',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  user  = this.authService.getUser();
  roles = this.authService.getRoles();

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '▦',  route: '/dashboard',  section: 'Principal' },

    // Solo ADMIN
    { label: 'Empresas',   icon: '🏢',  route: '/companies',  section: 'Principal', roles: ['ROLE_ADMIN'] },

    // ADMIN + GERENTE
    { label: 'Usuarios',   icon: '👤',  route: '/users',      section: 'Principal', roles: ['ROLE_ADMIN', 'ROLE_GERENTE'] },
    { label: 'Objetivos',  icon: '🎯',  route: '/objectives', section: 'Gestión',   roles: ['ROLE_ADMIN', 'ROLE_GERENTE'] },
    { label: 'Reportes',   icon: '📋',  route: '/reports',    section: 'Reportes',  roles: ['ROLE_ADMIN', 'ROLE_GERENTE'] },

    // TODOS
    { label: 'Locales',    icon: '📍',  route: '/stores',     section: 'Principal', roles: ['ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_SUPERVISOR']  },
    { label: 'Alertas',    icon: '🔔',  route: '/alerts',     section: 'Gestión',   roles: ['ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_SUPERVISOR'] },
    { label: 'Ventas',     icon: '💰',  route: '/sales',      section: 'Gestión',   roles: ['ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_SUPERVISOR'] },
    { label: 'KPI',        icon: '📊',  route: '/kpi',        section: 'Reportes',  roles: ['ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_SUPERVISOR'] },
  ];

  get sections(): string[] {
    return [...new Set(this.navItems.map(i => i.section))];
  }

  itemsBySection(section: string): NavItem[] {
    return this.navItems.filter(i => i.section === section);
  }

  canAccess(item: NavItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(r => this.roles.includes(r));
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  onNavClick(item: NavItem): void {
    if (!this.canAccess(item)) return;
    this.router.navigate([item.route]);
  }

  getUserInitials(): string {
    return (this.user?.name ?? this.user?.email ?? 'U').substring(0, 2).toUpperCase();
  }

  getRoleLabel(): string {
    const map: Record<string, string> = {
      ROLE_ADMIN:      'Administrador',
      ROLE_GERENTE:    'Gerente',
      ROLE_SUPERVISOR: 'Supervisor',
    };
    return map[this.roles[0]] ?? 'Usuario';
  }

  logout(): void {
    this.authService.logout();
  }
}
