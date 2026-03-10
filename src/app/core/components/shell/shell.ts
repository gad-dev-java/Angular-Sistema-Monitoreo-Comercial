import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../services/Auth';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'shell.css',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  user = this.authService.getUser();

  navItems = [
    { label: 'Dashboard',  icon: '▦',  route: '/dashboard',  section: 'Principal' },
    { label: 'Empresas',   icon: '🏢',  route: '/companies',  section: 'Principal' },
    { label: 'Locales',    icon: '📍',  route: '/stores',     section: 'Principal' },
    { label: 'Objetivos',  icon: '🎯',  route: '/objectives', section: 'Gestión'   },
    { label: 'Ventas',     icon: '💰',  route: '/sales',      section: 'Gestión'   },
    { label: 'Alertas',    icon: '🔔',  route: '/alerts',     section: 'Gestión',  badge: 3 },
    { label: 'KPI',        icon: '📊',  route: '/kpi',        section: 'Reportes'  },
    { label: 'Reportes',   icon: '📋',  route: '/reports',    section: 'Reportes'  },
  ];

  get sections(): string[] {
    return [...new Set(this.navItems.map(i => i.section))];
  }

  itemsBySection(section: string) {
    return this.navItems.filter(i => i.section === section);
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  getUserInitials(): string {
    return (this.user?.email ?? 'U').substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
